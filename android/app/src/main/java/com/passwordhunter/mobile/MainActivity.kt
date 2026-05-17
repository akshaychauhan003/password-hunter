package com.passwordhunter.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.ui.graphics.toArgb
import androidx.core.view.WindowCompat
import com.passwordhunter.mobile.theme.CyberThemeColors
import com.passwordhunter.mobile.theme.ThemePreferences
import com.passwordhunter.mobile.ui.PasswordHunterApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        val theme = ThemePreferences(this).getTheme()
        val colors = CyberThemeColors.forTheme(theme)

        // Apply saved theme to window before first frame (splash / startup)
        window.statusBarColor = colors.background.toArgb()
        window.navigationBarColor = colors.backgroundBoot.toArgb()

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.getInsetsController(window, window.decorView).isAppearanceLightStatusBars = false

        setContent {
            PasswordHunterApp()
        }
    }
}
