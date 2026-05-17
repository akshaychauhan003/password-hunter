package com.passwordhunter.mobile.theme

import android.content.Context

/**
 * Persists theme selection via SharedPreferences.
 * Storage key `theme` uses website-compatible ids (e.g. hacker-green).
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

    companion object {
        const val PREFS_NAME = "password-hunter-settings"
        const val KEY_THEME = "theme"
    }
}
