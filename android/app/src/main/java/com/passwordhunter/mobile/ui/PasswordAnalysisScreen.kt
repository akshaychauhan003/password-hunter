package com.passwordhunter.mobile.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.passwordhunter.mobile.BuildConfig
import com.passwordhunter.mobile.theme.CyberThemeColors
import com.passwordhunter.mobile.theme.CyberThemeId
import com.passwordhunter.mobile.theme.BruteForceMode
import com.passwordhunter.mobile.viewmodel.PasswordAnalysisViewModel
import kotlin.random.Random

@androidx.compose.material3.ExperimentalMaterial3Api
@Composable
fun PasswordAnalysisScreen(
    colors: CyberThemeColors,
    currentTheme: CyberThemeId,
    onThemeChange: (CyberThemeId) -> Unit,
    viewModel: PasswordAnalysisViewModel = viewModel(),
    isOffline: Boolean = false,
) {
    val password by viewModel.password.collectAsState()
    val analysis by viewModel.analysis.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val historySaveStatus by viewModel.historySaveStatus.collectAsState()
    val currentMode by viewModel.bruteForceMode.collectAsState()
    val currentSpeed by viewModel.simulationSpeed.collectAsState()
    val backendUrl by viewModel.backendUrl.collectAsState()

    val historySaveStatusText = historySaveStatus
    val currentAnalysis = analysis

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "PASSWORD HUNTER",
            color = colors.primary,
            fontFamily = FontFamily.Monospace,
            fontSize = 26.sp,
            modifier = Modifier.padding(bottom = 4.dp),
        )

        Text(
            "CYBER BRUTE-FORCE SIMULATOR",
            color = colors.primaryMuted,
            fontFamily = FontFamily.Monospace,
            fontSize = 11.sp,
            modifier = Modifier.padding(bottom = 18.dp),
        )

        ThemeSelector(colors, currentTheme, onThemeChange)

        Spacer(modifier = Modifier.height(12.dp))

        if (isOffline) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = colors.danger.copy(alpha = 0.15f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.danger.copy(alpha = 0.5f))
            ) {
                Text(
                    "Backend unavailable — running in offline mode",
                    modifier = Modifier.padding(12.dp),
                    color = colors.danger,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp
                )
            }
        }

        BruteForceOptions(colors, currentMode, currentSpeed, onModeSelected = viewModel::setBruteForceMode, onSpeedSelected = viewModel::setSimulationSpeed)

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = viewModel::updatePassword,
            label = { Text("ENTER PASSWORD", color = colors.primary) },
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, colors.border, shape = RoundedCornerShape(12.dp)),
            textStyle = MaterialTheme.typography.bodyMedium.copy(
                fontFamily = FontFamily.Monospace,
                color = Color.White,
            ),
            enabled = !isLoading,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            colors = TextFieldDefaults.outlinedTextFieldColors(
                focusedBorderColor = colors.primary,
                unfocusedBorderColor = colors.border,
                cursorColor = colors.primary,
                focusedLabelColor = colors.primary,
                unfocusedLabelColor = colors.textMuted,
                containerColor = colors.backgroundCard,
            ),
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { viewModel.analyzePassword() },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = colors.primary,
                contentColor = colors.background,
            ),
            enabled = password.isNotEmpty() && !isLoading,
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = colors.background, modifier = Modifier.size(24.dp))
            } else {
                Text("LAUNCH SIMULATION", fontFamily = FontFamily.Monospace)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        ActiveScanConsole(colors = colors, active = isLoading, speed = currentSpeed, mode = currentMode)

        if (historySaveStatusText != null) {
            Text(
                historySaveStatusText,
                color = colors.secondary,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                modifier = Modifier.padding(vertical = 8.dp),
            )
        }

        if (error != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp),
                colors = CardDefaults.cardColors(containerColor = colors.danger),
            ) {
                Text(
                    error!!,
                    modifier = Modifier.padding(12.dp),
                    color = Color.White,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }

        if (currentAnalysis != null) {
            Spacer(modifier = Modifier.height(18.dp))
            AnalysisResultsCard(currentAnalysis, colors)

            if (currentAnalysis.weaknesses.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    "Recommendations:",
                    color = colors.accent,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(bottom = 8.dp),
                )
                for (suggestion in currentAnalysis.suggestions.take(3)) {
                    Text(
                        "• $suggestion",
                        color = Color.White,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        val defaultBackend = BuildConfig.DEFAULT_BACKEND_URL
        val urlStr = if (backendUrl.isNotBlank()) backendUrl.removeSuffix("/") else defaultBackend
        Text(
            "Backend: $urlStr",
            color = colors.textMuted,
            fontFamily = FontFamily.Monospace,
            fontSize = 10.sp,
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}

@Composable
private fun BruteForceOptions(
    colors: CyberThemeColors,
    currentMode: BruteForceMode,
    currentSpeed: Int,
    onModeSelected: (BruteForceMode) -> Unit,
    onSpeedSelected: (Int) -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            BruteForceMode.values().forEach { mode ->
                val selected = mode == currentMode
                Card(
                    modifier = Modifier.weight(1f).clickable { onModeSelected(mode) },
                    colors = CardDefaults.cardColors(containerColor = if (selected) colors.primaryFaint else colors.backgroundCard),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 12.dp, horizontal = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                    ) {
                        Icon(
                            imageVector = if (mode == BruteForceMode.RANDOM) Icons.Default.AutoAwesome else Icons.Default.Speed,
                            contentDescription = null,
                            tint = if (selected) colors.primary else colors.textMuted,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            mode.label,
                            color = if (selected) colors.primary else colors.textMuted,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                "SPEED",
                color = colors.primaryMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
            )
            Slider(
                value = currentSpeed.toFloat(),
                onValueChange = { onSpeedSelected(it.toInt().coerceIn(1, 10)) },
                valueRange = 1f..10f,
                steps = 8,
                colors = androidx.compose.material3.SliderDefaults.colors(
                    activeTrackColor = colors.primary,
                    thumbColor = colors.secondary,
                    activeTickColor = colors.accent,
                ),
                modifier = Modifier.weight(1f),
            )
            Text(
                "${currentSpeed}x",
                color = colors.secondary,
                fontFamily = FontFamily.Monospace,
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun ActiveScanConsole(
    colors: CyberThemeColors,
    active: Boolean,
    speed: Int,
    mode: BruteForceMode,
) {
    val rows = remember { mutableStateListOf<String>() }

    LaunchedEffect(active, speed, mode) {
        rows.clear()
        repeat(6) { rows.add("[INITIALIZING SCAN] -> ....") }

        if (active) {
            while (true) {
                if (rows.size >= 6) rows.removeAt(0)
                rows.add(generateScanLine(mode))
                val delayMs = (1100L / speed).coerceAtLeast(110L)
                kotlinx.coroutines.delay(delayMs)
            }
        }
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .border(1.dp, colors.border, shape = RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(containerColor = colors.backgroundTerminal),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                if (active) "ACTIVE SEARCH CHANNEL" else "IDLE MODE",
                color = if (active) colors.secondary else colors.primaryMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                modifier = Modifier.padding(bottom = 8.dp),
            )
            rows.forEach { line ->
                Text(
                    line,
                    color = if (active) colors.primary.copy(alpha = 0.9f) else colors.textMuted,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    modifier = Modifier.padding(vertical = 1.dp),
                )
            }
        }
    }
}

private fun generateScanLine(mode: BruteForceMode): String {
    val charset = when (mode) {
        BruteForceMode.DICTIONARY -> "abcdefghijklmnopqrstuvwxyz0123456789"
        BruteForceMode.RULES -> "01!@#ABCDEabcde"
        BruteForceMode.RANDOM -> "0123456789ABCDEF"
    }
    return buildString {
        append("[")
        repeat(24) {
            append(charset[Random.nextInt(charset.length)])
        }
        append("] ⟵ ${mode.label}")
    }
}

@Composable
private fun ThemeSelector(
    colors: CyberThemeColors,
    currentTheme: CyberThemeId,
    onThemeChange: (CyberThemeId) -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            "THEME",
            color = colors.primaryMuted,
            fontFamily = FontFamily.Monospace,
            fontSize = 10.sp,
            modifier = Modifier.padding(bottom = 8.dp),
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            CyberThemeId.entries.forEach { theme ->
                val selected = theme == currentTheme
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .border(
                            width = 1.dp,
                            color = if (selected) colors.primary else colors.border,
                            shape = RoundedCornerShape(8.dp),
                        )
                        .background(
                            if (selected) colors.primaryFaint else Color.Transparent,
                            RoundedCornerShape(8.dp),
                        )
                        .clickable { onThemeChange(theme) }
                        .padding(vertical = 8.dp, horizontal = 4.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = theme.label.split(" ").first(),
                        color = if (selected) colors.primary else colors.textMuted,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 8.sp,
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

@Composable
fun AnalysisResultsCard(
    analysis: com.passwordhunter.mobile.network.PasswordAnalysis,
    colors: CyberThemeColors,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, colors.border, shape = RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = colors.backgroundCard),
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            ResultRow("Strength:", analysis.label, getDifficultyColor(analysis.difficultyLevel, colors), colors)
            ResultRow("Score:", "${analysis.score}/100", Color.White, colors)
            ResultRow("Entropy:", String.format("%.2f", analysis.entropy), Color.White, colors)
            ResultRow("Crack Time:", analysis.crackTimeDisplay, colors.danger, colors)

            if (analysis.weaknesses.isNotEmpty()) {
                Text(
                    "Weaknesses:",
                    fontFamily = FontFamily.Monospace,
                    color = colors.accent,
                    modifier = Modifier.padding(top = 12.dp, bottom = 4.dp),
                )
                for (weakness in analysis.weaknesses) {
                    Text(
                        "• $weakness",
                        fontFamily = FontFamily.Monospace,
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(bottom = 2.dp),
                    )
                }
            }
        }
    }
}

@Composable
fun ResultRow(
    label: String,
    value: String,
    valueColor: Color,
    colors: CyberThemeColors,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, fontFamily = FontFamily.Monospace, color = colors.primary)
        Text(value, fontFamily = FontFamily.Monospace, color = valueColor)
    }
}

fun getDifficultyColor(difficulty: String, colors: CyberThemeColors): Color = when (difficulty) {
    "Easy" -> colors.primary
    "Medium" -> colors.accent
    "Hard" -> Color(0xFFFF6B35)
    "Extreme" -> colors.danger
    "Impossible" -> colors.secondary
    else -> Color.White
}
