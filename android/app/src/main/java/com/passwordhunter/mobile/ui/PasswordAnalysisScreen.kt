package com.passwordhunter.mobile.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.passwordhunter.mobile.theme.CyberThemeColors
import com.passwordhunter.mobile.theme.CyberThemeId
import com.passwordhunter.mobile.viewmodel.PasswordAnalysisViewModel

@Composable
fun PasswordAnalysisScreen(
    colors: CyberThemeColors,
    currentTheme: CyberThemeId,
    onThemeChange: (CyberThemeId) -> Unit,
    viewModel: PasswordAnalysisViewModel = viewModel(),
) {
    val password by viewModel.password.collectAsState()
    val analysis by viewModel.analysis.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "PASSWORD HUNTER",
            style = MaterialTheme.typography.headlineLarge.copy(
                fontFamily = FontFamily.Monospace,
                color = colors.primary,
                fontSize = 24.sp,
            ),
            modifier = Modifier.padding(bottom = 8.dp),
        )

        Text(
            "CYBER BRUTE-FORCE SIMULATOR",
            color = colors.textMuted,
            fontFamily = FontFamily.Monospace,
            fontSize = 10.sp,
            modifier = Modifier.padding(bottom = 16.dp),
        )

        ThemeSelector(
            colors = colors,
            currentTheme = currentTheme,
            onThemeChange = onThemeChange,
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = viewModel::updatePassword,
            label = { Text("Enter Password", color = colors.primary) },
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, colors.border, shape = RoundedCornerShape(8.dp)),
            textStyle = MaterialTheme.typography.bodyMedium.copy(
                fontFamily = FontFamily.Monospace,
                color = colors.primary,
            ),
            enabled = !isLoading,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = colors.primary,
                unfocusedBorderColor = colors.border,
                cursorColor = colors.primary,
                focusedLabelColor = colors.primary,
                unfocusedLabelColor = colors.primaryMuted,
            ),
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { viewModel.analyzePassword() },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = colors.primary,
                contentColor = colors.background,
            ),
            enabled = password.isNotEmpty() && !isLoading,
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    color = colors.background,
                    modifier = Modifier.size(24.dp),
                )
            } else {
                Text("ANALYZE", fontFamily = FontFamily.Monospace)
            }
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

        if (analysis != null) {
            Spacer(modifier = Modifier.height(24.dp))
            AnalysisResultsCard(analysis!!, colors)
        }
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
            .border(1.dp, colors.border, shape = RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = colors.backgroundCard),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
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
                analysis.weaknesses.forEach {
                    Text(
                        "• $it",
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
private fun ResultRow(
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
