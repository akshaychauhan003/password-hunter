package com.passwordhunter.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import com.passwordhunter.mobile.network.PasswordAnalysisRequest
import com.passwordhunter.mobile.network.RetrofitClient
import android.app.Application
import androidx.lifecycle.AndroidViewModel

class PasswordAnalysisViewModel(application: Application) : AndroidViewModel(application) {
    private val api = RetrofitClient.getInstance(application)
    
    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password
    
    private val _analysis = MutableStateFlow<com.passwordhunter.mobile.network.PasswordAnalysis?>(null)
    val analysis: StateFlow<com.passwordhunter.mobile.network.PasswordAnalysis?> = _analysis
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error
    
    fun updatePassword(newPassword: String) {
        _password.value = newPassword
    }
    
    fun analyzePassword() {
        if (_password.value.isEmpty()) {
            _error.value = "Please enter a password"
            return
        }
        
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val response = api.analyzePassword(PasswordAnalysisRequest(_password.value))
                if (response.success && response.data != null) {
                    _analysis.value = response.data
                } else {
                    _error.value = response.message ?: "Analysis failed"
                }
            } catch (e: Exception) {
                _error.value = "Error: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
