package com.passwordhunter.mobile.network

import android.content.Context
import com.passwordhunter.mobile.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.google.gson.GsonBuilder
import java.util.concurrent.TimeUnit
import com.passwordhunter.mobile.theme.ThemePreferences

object RetrofitClient {
    private var cachedInstance: PasswordHunterApi? = null
    private var cachedBaseUrl: String? = null
    
    private fun normalizeUrl(url: String): String {
        val trimmed = url.trim().takeIf { it.isNotEmpty() } ?: BuildConfig.DEFAULT_BACKEND_URL
        val withScheme = if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            "http://$trimmed"
        }
        return if (withScheme.endsWith("/")) withScheme else "$withScheme/"
    }

    fun getInstance(context: Context): PasswordHunterApi {
        val backendUrl = normalizeUrl(ThemePreferences(context).getBackendUrl())
        
        // Return cached instance if URL hasn't changed
        if (cachedInstance != null && cachedBaseUrl == backendUrl) {
            return cachedInstance!!
        }
        
        android.util.Log.d("RetrofitClient", "Creating Retrofit instance for: $backendUrl")
        
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val httpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .build()

        val gson = GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
            .create()

        val instance = Retrofit.Builder()
            .baseUrl(backendUrl)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(PasswordHunterApi::class.java)
        
        cachedInstance = instance
        cachedBaseUrl = backendUrl
        return instance
    }
    
    fun clearCache() {
        cachedInstance = null
        cachedBaseUrl = null
    }
}
