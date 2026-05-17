package com.passwordhunter.mobile.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.passwordhunter.mobile.theme.CyberThemeColors
import com.passwordhunter.mobile.theme.CyberThemeId
import com.passwordhunter.mobile.theme.ThemePreferences

@Composable
fun PasswordHunterApp() {
    val context = LocalContext.current
    val prefs = remember { ThemePreferences(context) }
    var themeId by remember { mutableStateOf(prefs.getTheme()) }
    val colors = remember(themeId) { CyberThemeColors.forTheme(themeId) }
    var booted by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = colors.background,
    ) {
        if (!booted) {
            BootScreen(
                colors = colors,
                onComplete = { booted = true },
            )
        } else {
            PasswordAnalysisScreen(
                colors = colors,
                currentTheme = themeId,
                onThemeChange = { newTheme ->
                    prefs.setTheme(newTheme)
                    themeId = newTheme
                },
            )
        }
    }
}
