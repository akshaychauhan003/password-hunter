package com.passwordhunter.mobile.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.passwordhunter.mobile.theme.CyberMaterialTheme
import com.passwordhunter.mobile.theme.CyberThemeColors
import com.passwordhunter.mobile.theme.CyberThemeId
import com.passwordhunter.mobile.theme.ThemePreferences
import com.passwordhunter.mobile.viewmodel.PasswordAnalysisViewModel

@kotlin.OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun PasswordHunterApp() {
    val context = LocalContext.current
    val prefs = remember { ThemePreferences(context) }
    var themeId by remember { mutableStateOf(prefs.getTheme()) }
    val colors = remember(themeId) { CyberThemeColors.forTheme(themeId) }
    val viewModel: PasswordAnalysisViewModel = viewModel()
    var selectedTab by remember { mutableStateOf(AppTab.ANALYZE) }
    var booted by remember { mutableStateOf(false) }
    var isOffline by remember { mutableStateOf(false) }

    CyberMaterialTheme(colors = colors) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = colors.background,
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                CyberBackground(colors)

                Column(modifier = Modifier.fillMaxSize()) {
                    if (!booted) {
                        BootScreen(
                            colors = colors,
                            onComplete = { online ->
                                isOffline = !online
                                viewModel.setOfflineMode(!online)
                                booted = true
                            },
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth(),
                        ) {
                            when (selectedTab) {
                                AppTab.ANALYZE -> PasswordAnalysisScreen(
                                    colors = colors,
                                    currentTheme = themeId,
                                    onThemeChange = { newTheme ->
                                        prefs.setTheme(newTheme)
                                        themeId = newTheme
                                    },
                                    viewModel = viewModel,
                                    isOffline = isOffline || viewModel.isOfflineMode.collectAsState().value,
                                )
                                AppTab.HISTORY -> HistoryScreen(colors = colors, viewModel = viewModel)
                                AppTab.SETTINGS -> SettingsScreen(
                                    colors = colors,
                                    currentTheme = themeId,
                                    currentMode = viewModel.bruteForceMode.collectAsState().value,
                                    currentSpeed = viewModel.simulationSpeed.collectAsState().value,
                                    backendUrl = viewModel.backendUrl.collectAsState().value,
                                    onThemeChange = { newTheme ->
                                        prefs.setTheme(newTheme)
                                        themeId = newTheme
                                    },
                                    onModeChange = viewModel::setBruteForceMode,
                                    onSpeedChange = viewModel::setSimulationSpeed,
                                    onBackendUrlChange = viewModel::updateBackendUrl,
                                )
                            }
                        }

                        NavigationBar(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp),
                            containerColor = colors.backgroundCard.copy(alpha = 0.92f),
                        ) {
                            AppTab.entries.forEach { tab ->
                                NavigationBarItem(
                                    selected = selectedTab == tab,
                                    onClick = {
                                        selectedTab = tab
                                        if (tab == AppTab.HISTORY) {
                                            viewModel.loadHistory()
                                        }
                                    },
                                    icon = {
                                        Icon(
                                            tab.icon,
                                            contentDescription = tab.label,
                                            tint = if (selectedTab == tab) colors.primary else colors.textMuted,
                                        )
                                    },
                                    label = {
                                        Text(
                                            tab.label,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (selectedTab == tab) colors.primary else colors.textMuted,
                                        )
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = colors.primary,
                                        selectedTextColor = colors.primary,
                                        unselectedIconColor = colors.textMuted,
                                        unselectedTextColor = colors.textMuted,
                                        indicatorColor = colors.primaryFaint,
                                    ),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
