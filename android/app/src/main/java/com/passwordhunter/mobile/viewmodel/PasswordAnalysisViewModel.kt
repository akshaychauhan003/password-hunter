package com.passwordhunter.mobile.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.passwordhunter.mobile.network.HistoryRequest
import com.passwordhunter.mobile.network.PasswordAnalysisRequest
import com.passwordhunter.mobile.network.RetrofitClient
import com.passwordhunter.mobile.network.SimulationHistory
import com.passwordhunter.mobile.theme.BruteForceMode
import com.passwordhunter.mobile.theme.ThemePreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

private const val TAG = "PasswordAnalysisVM"

class PasswordAnalysisViewModel(application: Application) : AndroidViewModel(application) {
    private val prefs = ThemePreferences(application)

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
        // Clear cache so it re-creates instance with new URL
        RetrofitClient.clearCache()
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

            try {
                Log.d(TAG, "Analyzing password...")
                val response = api().analyzePassword(PasswordAnalysisRequest(_password.value))
                if (response.success && response.data != null) {
                    _analysis.value = response.data
                    Log.d(TAG, "Analysis successful: ${response.data.label}")
                    if (!_isOfflineMode.value) {
                        saveHistory(_password.value, response.data)
                    }
                } else {
                    _error.value = response.message ?: "Analysis failed"
                    Log.w(TAG, "Analysis failed: ${_error.value}")
                }
            } catch (e: Exception) {
                _isOfflineMode.value = true
                _error.value = "Backend unavailable - running in offline mode. Error: ${e.localizedMessage}"
                Log.e(TAG, "Network error during analysis", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    private suspend fun saveHistory(password: String, analysis: com.passwordhunter.mobile.network.PasswordAnalysis) {
        try {
            Log.d(TAG, "Saving history...")
            val request = buildHistoryRequest(password, analysis)
            val saveResponse = api().saveHistory(request)
            _historySaveStatus.value = if (saveResponse.success) {
                Log.d(TAG, "History saved successfully")
                loadHistory()
                "Saved to history"
            } else {
                Log.w(TAG, "History save failed: ${saveResponse.message}")
                saveResponse.message ?: "Failed to save history"
            }
        } catch (e: Exception) {
            _historySaveStatus.value = "History save failed (offline mode)"
            Log.e(TAG, "Error saving history", e)
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            _historyLoading.value = true
            _historyError.value = null

            try {
                Log.d(TAG, "Loading history...")
                val response = api().getHistory(page = 1, limit = 30)
                if (response.success && response.data != null) {
                    _history.value = response.data.items
                    Log.d(TAG, "History loaded: ${response.data.items.size} items")
                } else {
                    _historyError.value = "Unable to load history"
                    Log.w(TAG, "History load failed: ${_historyError.value}")
                }
            } catch (e: Exception) {
                _isOfflineMode.value = true
                _historyError.value = "Cannot connect to backend (offline mode)"
                Log.e(TAG, "Error loading history", e)
            } finally {
                _historyLoading.value = false
            }
        }
    }

    fun deleteHistory(historyId: String) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Deleting history item: $historyId")
                api().deleteHistory(historyId)
                loadHistory()
            } catch (e: Exception) {
                _historyError.value = "Failed to delete history"
                Log.e(TAG, "Error deleting history", e)
            }
        }
    }

    fun clearHistory() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Clearing all history")
                api().deleteAllHistory()
                loadHistory()
            } catch (e: Exception) {
                _historyError.value = "Failed to clear history"
                Log.e(TAG, "Error clearing history", e)
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
            val attempts = Math.round(Math.pow(2.0, capped))
            if (attempts < 0) Long.MAX_VALUE else attempts
        }
    }

    private fun estimateSimulationDurationMs(entropy: Double, speed: Int): Long {
        val base = 1400.0 + (entropy * 120.0)
        return (base / speed).toLong().coerceAtLeast(300L)
    }
}
