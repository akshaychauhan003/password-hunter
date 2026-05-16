package com.passwordhunter.mobile.network

import java.time.LocalDateTime

data class SimulationHistory(
    val id: String? = null,
    val target: String,
    val maskedTarget: String,
    val totalAttempts: Long,
    val timeTakenMs: Long,
    val modeUsed: String,
    val difficultyLabel: String,
    val difficultyScore: Double,
    val estimatedCrackTime: String,
    val charLength: Int,
    val charsetSize: Int,
    val entropy: Double,
    val dateTime: String? = null
)

data class HistoryRequest(
    val target: String,
    val maskedTarget: String,
    val totalAttempts: Long,
    val timeTakenMs: Long,
    val modeUsed: String,
    val difficultyLabel: String,
    val difficultyScore: Double,
    val estimatedCrackTime: String,
    val charLength: Int,
    val charsetSize: Int,
    val entropy: Double
)

data class HistoryResponse(
    val items: List<SimulationHistory>,
    val total: Long,
    val page: Int,
    val limit: Int
)

data class HistoryApiResponse(
    val success: Boolean,
    val data: HistoryResponse? = null
)
