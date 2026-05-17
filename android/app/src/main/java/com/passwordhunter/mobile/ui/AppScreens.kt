package com.passwordhunter.mobile.ui

import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ProgressIndicatorDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.passwordhunter.mobile.BuildConfig
import com.passwordhunter.mobile.network.SimulationHistory
import com.passwordhunter.mobile.theme.BruteForceMode
import com.passwordhunter.mobile.theme.CyberThemeColors
import com.passwordhunter.mobile.theme.CyberThemeId
import com.passwordhunter.mobile.viewmodel.PasswordAnalysisViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings

enum class AppTab(val label: String, val icon: ImageVector) {
    ANALYZE("HUNTER", Icons.Default.Analytics),
    HISTORY("HISTORY", Icons.Default.History),
    SETTINGS("SETTINGS", Icons.Default.Settings)
}

@Composable
fun CyberBackground(colors: CyberThemeColors) {
    val transition = rememberInfiniteTransition()
    val glowProgress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(durationMillis = 8000))
    )

    Box(modifier = Modifier.fillMaxSize().background(
        Brush.verticalGradient(
            colors = listOf(colors.backgroundBoot, colors.background, colors.backgroundTerminal),
        )
    )) {
        Canvas(modifier = Modifier.matchParentSize()) {
            val lineAlpha = 0.06f
            val lineSpacing = 28.dp.toPx()
            var y = 0f
            while (y < size.height) {
                drawLine(
                    color = colors.primary.copy(alpha = lineAlpha),
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = 1f,
                )
                y += lineSpacing
            }

            var x = 0f
            while (x < size.width) {
                drawLine(
                    color = colors.primary.copy(alpha = 0.03f),
                    start = Offset(x, 0f),
                    end = Offset(x, size.height),
                    strokeWidth = 1f,
                )
                x += lineSpacing * 2f
            }

            val glowWidth = size.width * 0.14f
            drawRoundRect(
                brush = Brush.verticalGradient(
                    colors = listOf(colors.secondary.copy(alpha = 0.15f), Color.Transparent),
                ),
                topLeft = Offset(size.width * 0.16f, 0f),
                size = Size(glowWidth, size.height),
                cornerRadius = CornerRadius(120f, 120f),
            )
            drawRoundRect(
                brush = Brush.verticalGradient(
                    colors = listOf(colors.accent.copy(alpha = 0.14f), Color.Transparent),
                ),
                topLeft = Offset(size.width * 0.62f, 0f),
                size = Size(glowWidth, size.height),
                cornerRadius = CornerRadius(120f, 120f),
            )

            drawRoundRect(
                color = colors.primary.copy(alpha = 0.02f),
                topLeft = Offset(size.width * 0.4f + glowProgress * size.width * 0.1f, 0f),
                size = Size(size.width * 0.12f, size.height),
                cornerRadius = CornerRadius(90f, 90f),
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(colors.primary.copy(alpha = 0.08f), Color.Transparent),
                        center = Offset(x = 0f, y = 0f),
                        radius = 420f,
                    )
                )
        )
    }
}

@Composable
fun HistoryScreen(
    colors: CyberThemeColors,
    viewModel: PasswordAnalysisViewModel,
) {
    val history by viewModel.history.collectAsState()
    val isLoading by viewModel.historyLoading.collectAsState()
    val error by viewModel.historyError.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadHistory()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "HISTORY OVERVIEW",
            color = colors.primary,
            fontFamily = FontFamily.Monospace,
            fontSize = 22.sp,
            modifier = Modifier.padding(bottom = 10.dp),
        )

        if (isLoading) {
            Text(
                "Loading history...",
                color = colors.textMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 12.sp,
                modifier = Modifier.padding(bottom = 12.dp),
            )
        }

        if (error != null) {
            Text(
                error ?: "Unable to load history",
                color = colors.danger,
                fontFamily = FontFamily.Monospace,
                fontSize = 12.sp,
                modifier = Modifier.padding(bottom = 12.dp),
            )
        }

        if (history.isEmpty() && !isLoading) {
            Text(
                "No saved sessions yet. Analyze a password to store a new history entry.",
                color = colors.textMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 12.sp,
                modifier = Modifier.padding(12.dp),
            )
        }

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(history) { item ->
                HistoryCard(item = item, colors = colors, onDelete = { item.id?.let(viewModel::deleteHistory) })
            }
        }

        OutlinedButton(
            onClick = { viewModel.clearHistory() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            shape = RoundedCornerShape(12.dp),
            colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(contentColor = colors.accent),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.accent),
        ) {
            Text("CLEAR ALL HISTORY", fontFamily = FontFamily.Monospace)
        }
    }
}

@Composable
private fun HistoryCard(
    item: SimulationHistory,
    colors: CyberThemeColors,
    onDelete: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { /* no-op */ },
        colors = CardDefaults.cardColors(containerColor = colors.backgroundCard),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(item.maskedTarget, color = colors.primary, fontFamily = FontFamily.Monospace, fontSize = 15.sp)
                Text(item.difficultyLabel, color = colors.secondary, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
            }

            Text(
                "Mode: ${item.modeUsed} · Attempts: ${item.totalAttempts}",
                color = colors.textMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                modifier = Modifier.padding(vertical = 8.dp),
            )

            Text(
                "Entropy: ${String.format("%.2f", item.entropy)} · Time: ${item.estimatedCrackTime}",
                color = Color.White,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.End,
            ) {
                TextButton(onClick = onDelete) {
                    Text("DELETE", color = colors.danger, fontFamily = FontFamily.Monospace)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    colors: CyberThemeColors,
    currentTheme: CyberThemeId,
    currentMode: BruteForceMode,
    currentSpeed: Int,
    backendUrl: String,
    onThemeChange: (CyberThemeId) -> Unit,
    onModeChange: (BruteForceMode) -> Unit,
    onSpeedChange: (Int) -> Unit,
    onBackendUrlChange: (String) -> Unit,
) {
    var backendInput by rememberSaveable { mutableStateOf(backendUrl) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "SETTINGS & ADVANCED",
            color = colors.primary,
            fontFamily = FontFamily.Monospace,
            fontSize = 22.sp,
            modifier = Modifier.padding(bottom = 10.dp),
        )

        SettingSection(title = "THEME", colors = colors) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CyberThemeId.entries.forEach { theme ->
                    val selected = theme == currentTheme
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onThemeChange(theme) },
                        colors = CardDefaults.cardColors(containerColor = if (selected) colors.primaryFaint else colors.backgroundCard),
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        Text(
                            theme.label,
                            color = if (selected) colors.primary else colors.textMuted,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(12.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }

        SettingSection(title = "MODE", colors = colors) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                BruteForceMode.values().forEach { mode ->
                    val selected = mode == currentMode
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onModeChange(mode) },
                        colors = CardDefaults.cardColors(containerColor = if (selected) colors.primaryFaint else colors.backgroundCard),
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        Text(
                            mode.label,
                            color = if (selected) colors.primary else colors.textMuted,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(12.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }

        SettingSection(title = "SPEED", colors = colors) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "${currentSpeed}x SIMULATION",
                    color = colors.textMuted,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                )
                Slider(
                    value = currentSpeed.toFloat(),
                    onValueChange = { onSpeedChange(it.toInt().coerceAtLeast(1)) },
                    valueRange = 1f..10f,
                    steps = 8,
                    colors = androidx.compose.material3.SliderDefaults.colors(
                        activeTrackColor = colors.primary,
                        thumbColor = colors.secondary,
                        activeTickColor = colors.accent,
                    ),
                )
            }
        }

        SettingSection(title = "BACKEND URL", colors = colors) {
            OutlinedTextField(
                value = backendInput,
                onValueChange = { backendInput = it },
                label = { Text("Backend endpoint", color = colors.primary) },
                placeholder = { Text("http://192.168.x.x:8080/", color = colors.textMuted) },
                modifier = Modifier.fillMaxWidth(),
                textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace, color = Color.White),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                colors = androidx.compose.material3.TextFieldDefaults.outlinedTextFieldColors(
                    focusedBorderColor = colors.primary,
                    unfocusedBorderColor = colors.border,
                    cursorColor = colors.primary,
                    focusedLabelColor = colors.primary,
                    unfocusedLabelColor = colors.textMuted,
                ),
            )

            TextButton(onClick = { onBackendUrlChange(backendInput) }) {
                Text("SAVE BACKEND URL", color = colors.secondary, fontFamily = FontFamily.Monospace)
            }

            Text(
                "Default: ${BuildConfig.DEFAULT_BACKEND_URL}",
                color = colors.textMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

@Composable
private fun SettingSection(
    title: String,
    colors: CyberThemeColors,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.backgroundCard, RoundedCornerShape(18.dp))
            .padding(16.dp)
            .padding(bottom = 12.dp),
    ) {
        Text(
            title,
            color = colors.primary,
            fontFamily = FontFamily.Monospace,
            fontSize = 11.sp,
            modifier = Modifier.padding(bottom = 10.dp),
        )
        content()
    }
}
