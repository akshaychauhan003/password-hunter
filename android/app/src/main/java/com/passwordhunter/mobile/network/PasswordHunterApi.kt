package com.passwordhunter.mobile.network

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Body
import retrofit2.http.Query

interface PasswordHunterApi {
    
    @POST("api/analysis")
    suspend fun analyzePassword(@Body request: PasswordAnalysisRequest): ApiResponse<PasswordAnalysis>
    
    @GET("api/history")
    suspend fun getHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("difficulty") difficulty: String? = null
    ): HistoryApiResponse
    
    @POST("api/history")
    suspend fun saveHistory(@Body request: HistoryRequest): ApiResponse<SimulationHistory>
}
