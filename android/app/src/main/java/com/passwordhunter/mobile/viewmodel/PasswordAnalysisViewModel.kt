package com.passwordhunter.mobile.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.passwordhunter.mobile.analysis.LocalPasswordAnalyzer
import com.passwordhunter.mobile.data.LocalHistoryStore
import com.passwordhunter.mobile.network.HistoryRequest
import com.passwordhunter.mobile.network.PasswordAnalysisRequest
import com.passwordhunter.mobile.network.RetrofitClient
import com.passwordhunter.mobile.network.SimulationHistory
import com.passwordhunter.mobile.theme.BruteForceMode
import com.passwordhunter.mobile.theme.ThemePreferences
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlin.math.pow
import kotlin.math.round
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

private const val TAG = "PasswordAnalysisVM"

class PasswordAnalysisViewModel(application: Application) : AndroidViewModel(application) {
    private val prefs = ThemePreferences(application)
    private val localHistory = LocalHistoryStore(application)

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password

    private val _analysis = MutableStateFlow<com.passwordhunter.mobile.network.PasswordAnalysis?>(null)
    val analysis: StateFlow<com.passwordhunter.mobile.network.PasswordAnalysis?> = _analysis

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _bruteForceMode = MutableStateFlow(prefs.getBruteForceMode())
    val bruteForceMode: StateFlow<BruteForceMode> = _bruteForceMode

    private val _simulationSpeed = MutableStateFlow(prefs.getSimulationSpeed())
    val simulationSpeed: StateFlow<Int> = _simulationSpeed

    private val _backendUrl = MutableStateFlow(prefs.getBackendUrl())
    val backendUrl: StateFlow<String> = _backendUrl

    private val _history = MutableStateFlow<List<SimulationHistory>>(emptyList())
    val history: StateFlow<List<SimulationHistory>> = _history

    private val _historyLoading = MutableStateFlow(false)
    val historyLoading: StateFlow<Boolean> = _historyLoading

    private val _historyError = MutableStateFlow<String?>(null)
    val historyError: StateFlow<String?> = _historyError

    private val _historySaveStatus = MutableStateFlow<String?>(null)
    val historySaveStatus: StateFlow<String?> = _historySaveStatus

    private val _isOfflineMode = MutableStateFlow(false)
    val isOfflineMode: StateFlow<Boolean> = _isOfflineMode

    private fun api() = RetrofitClient.getInstance(getApplication())

    fun setOfflineMode(offline: Boolean) {
        _isOfflineMode.value = offline
        if (offline) {
            loadLocalHistory()
        }
    }

    fun updatePassword(newPassword: String) {
        _password.value = newPassword
        _error.value = null
    }

    fun setBruteForceMode(mode: BruteForceMode) {
        _bruteForceMode.value = mode
        prefs.setBruteForceMode(mode)
    }

    fun setSimulationSpeed(speed: Int) {
        _simulationSpeed.value = speed.coerceIn(1, 10)
        prefs.setSimulationSpeed(_simulationSpeed.value)
    }

    fun updateBackendUrl(url: String) {
        prefs.setBackendUrl(url)
        _backendUrl.value = prefs.getBackendUrl()
        RetrofitClient.clearCache()
        _isOfflineMode.value = false
    }

    fun analyzePassword() {
        if (_password.value.isEmpty()) {
            _error.value = "Please enter a password"
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _historySaveStatus.value = null

            val speed = _simulationSpeed.value
            val simDelay = (1400L / speed).coerceAtLeast(300L)
            delay(simDelay)

            if (_isOfflineMode.value) {
                runLocalAnalysis()
                _isLoading.value = false
                return@launch
            }

            try {
                Log.d(TAG, "Analyzing password via backend...")
                val response = api().analyzePassword(PasswordAnalysisRequest(_password.value))
                if (response.success && response.data != null) {
                    _analysis.value = response.data
                    saveHistory(_password.value, response.data)
                } else {
                    _error.value = response.message ?: "Analysis failed"
                }
            } catch (e: Exception) {
                Log.e(TAG, "Backend unavailable, switching to offline analysis", e)
                _isOfflineMode.value = true
                runLocalAnalysis()
            } finally {
                _isLoading.value = false
            }
        }
    }

    private suspend fun runLocalAnalysis() {
        val result = LocalPasswordAnalyzer.analyse(_password.value)
        _analysis.value = result
        _error.value = null
        saveLocalHistory(_password.value, result)
        _historySaveStatus.value = "Saved locally (offline mode)"
        Log.d(TAG, "Local analysis complete: ${result.label}")
    }

    private suspend fun saveHistory(password: String, analysis: com.passwordhunter.mobile.network.PasswordAnalysis) {
        try {
            val request = buildHistoryRequest(password, analysis)
            val saveResponse = api().saveHistory(request)
            _historySaveStatus.value = if (saveResponse.success) {
                loadHistory()
                "Saved to history"
            } else {
                saveResponse.message ?: "Failed to save history"
            }
        } catch (e: Exception) {
            _isOfflineMode.value = true
            saveLocalHistory(password, analysis)
            _historySaveStatus.value = "Saved locally (offline mode)"
            Log.e(TAG, "History save failed, stored locally", e)
        }
    }

    private fun saveLocalHistory(password: String, analysis: com.passwordhunter.mobile.network.PasswordAnalysis) {
        val request = buildHistoryRequest(password, analysis)
        val item = SimulationHistory(
            id = null,
            target = request.target,
            maskedTarget = request.maskedTarget,
            totalAttempts = request.totalAttempts,
            timeTakenMs = request.timeTakenMs,
            modeUsed = request.modeUsed,
            difficultyLabel = request.difficultyLabel,
            difficultyScore = request.difficultyScore,
            estimatedCrackTime = request.estimatedCrackTime,
            charLength = request.charLength,
            charsetSize = request.charsetSize,
            entropy = request.entropy,
        )
        localHistory.save(item)
        loadLocalHistory()
    }

    fun loadHistory() {
        if (_isOfflineMode.value) {
            loadLocalHistory()
            return
        }

        viewModelScope.launch {
            _historyLoading.value = true
            _historyError.value = null

            try {
                val response = api().getHistory(page = 1, limit = 30)
                if (response.success && response.data != null) {
                    _history.value = response.data.items
                } else {
                    _historyError.value = "Unable to load history"
                }
            } catch (e: Exception) {
                Log.e(TAG, "History load failed, using local store", e)
                _isOfflineMode.value = true
                loadLocalHistory()
                _historyError.value = null
            } finally {
                _historyLoading.value = false
            }
        }
    }

    private fun loadLocalHistory() {
        _history.value = localHistory.getAll()
        _historyLoading.value = false
        _historyError.value = null
    }

    fun deleteHistory(historyId: String) {
        if (_isOfflineMode.value) {
            localHistory.delete(historyId)
            loadLocalHistory()
            return
        }

        viewModelScope.launch {
            try {
                api().deleteHistory(historyId)
                loadHistory()
            } catch (e: Exception) {
                localHistory.delete(historyId)
                _isOfflineMode.value = true
                loadLocalHistory()
            }
        }
    }

    fun clearHistory() {
        if (_isOfflineMode.value) {
            localHistory.clear()
            loadLocalHistory()
            return
        }

        viewModelScope.launch {
            try {
                api().deleteAllHistory()
                loadHistory()
            } catch (e: Exception) {
                localHistory.clear()
                _isOfflineMode.value = true
                loadLocalHistory()
            }
        }
    }

    private fun buildHistoryRequest(
        password: String,
        analysis: com.passwordhunter.mobile.network.PasswordAnalysis,
    ): HistoryRequest {
        return HistoryRequest(
            target = password,
            maskedTarget = password.mapIndexed { index, char ->
                when {
                    password.length <= 2 -> "*"
                    index == 0 || index == password.lastIndex -> char.toString()
                    else -> "*"
                }
            }.joinToString(""),
            totalAttempts = estimateAttempts(analysis.entropy),
            timeTakenMs = estimateSimulationDurationMs(analysis.entropy, _simulationSpeed.value),
            modeUsed = _bruteForceMode.value.label,
            difficultyLabel = analysis.label,
            difficultyScore = analysis.score.toDouble(),
            estimatedCrackTime = analysis.crackTimeDisplay,
            charLength = password.length,
            charsetSize = analysis.charsetSize,
            entropy = analysis.entropy,
        )
    }

    private fun estimateAttempts(entropy: Double): Long {
        return if (entropy <= 0.0) {
            0L
        } else {
            val capped = entropy.coerceAtMost(62.0)
            val attempts = round(2.0.pow(capped)).toLong()
            if (attempts < 0) Long.MAX_VALUE else attempts
        }
    }

    private fun estimateSimulationDurationMs(entropy: Double, speed: Int): Long {
        val base = 1400.0 + (entropy * 120.0)
        return (base / speed).toLong().coerceAtLeast(300L)
    }
}
