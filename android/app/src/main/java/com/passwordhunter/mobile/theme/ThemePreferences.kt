package com.passwordhunter.mobile.theme

import android.content.Context
import com.passwordhunter.mobile.BuildConfig

/**
 * Persists theme selection and app settings via SharedPreferences.
 * Storage keys are compatible with the website theme IDs and support advanced Android config.
 */
class ThemePreferences(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun getTheme(): CyberThemeId {
        val key = prefs.getString(KEY_THEME, null)
        return CyberThemeId.fromStorageKey(key)
    }

    fun setTheme(theme: CyberThemeId) {
        prefs.edit().putString(KEY_THEME, theme.storageKey).apply()
    }

    fun getBackendUrl(): String {
        val saved = prefs.getString(KEY_BACKEND_URL, null)
        return saved?.trim()?.takeIf { it.isNotEmpty() } ?: BuildConfig.DEFAULT_BACKEND_URL
    }

    fun setBackendUrl(url: String) {
        prefs.edit().putString(KEY_BACKEND_URL, normalizeUrl(url)).apply()
    }

    fun getBruteForceMode(): BruteForceMode {
        val key = prefs.getString(KEY_MODE, null)
        return BruteForceMode.fromStorageKey(key)
    }

    fun setBruteForceMode(mode: BruteForceMode) {
        prefs.edit().putString(KEY_MODE, mode.storageKey).apply()
    }

    fun getSimulationSpeed(): Int {
        return prefs.getInt(KEY_SPEED, DEFAULT_SIMULATION_SPEED)
    }

    fun setSimulationSpeed(speed: Int) {
        prefs.edit().putInt(KEY_SPEED, speed.coerceIn(1, 10)).apply()
    }

    private fun normalizeUrl(value: String): String {
        val trimmed = value.trim().takeIf { it.isNotEmpty() } ?: BuildConfig.DEFAULT_BACKEND_URL
        val withScheme = if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            "http://$trimmed"
        }
        return if (withScheme.endsWith("/")) withScheme else "$withScheme/"
    }

    companion object {
        const val PREFS_NAME = "password-hunter-settings"
        const val KEY_THEME = "theme"
        const val KEY_BACKEND_URL = "backend_url"
        const val KEY_MODE = "brute_force_mode"
        const val KEY_SPEED = "simulation_speed"
        const val DEFAULT_SIMULATION_SPEED = 6
    }
}

enum class BruteForceMode(val storageKey: String, val label: String) {
    DICTIONARY("dictionary", "DICTIONARY"),
    RULES("rules", "RULES"),
    RANDOM("random", "RANDOM");

    companion object {
        val DEFAULT = RULES
        fun fromStorageKey(key: String?): BruteForceMode =
            values().find { it.storageKey == key } ?: DEFAULT
    }
}
