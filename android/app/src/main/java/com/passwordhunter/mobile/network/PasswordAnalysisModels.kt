package com.passwordhunter.mobile.network

data class PasswordAnalysis(
    val score: Int,
    val label: String,
    val entropy: Double,
    val charsetSize: Int,
    val crackTimeDisplay: String,
    val charDiversity: CharDiversity,
    val weaknesses: List<String>,
    val suggestions: List<String>,
    val difficultyLevel: String
)

data class CharDiversity(
    val hasLower: Boolean,
    val hasUpper: Boolean,
    val hasDigit: Boolean,
    val hasSymbol: Boolean
)

data class PasswordAnalysisRequest(
    val password: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)
