package com.passwordhunter.mobile.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import com.passwordhunter.mobile.viewmodel.PasswordAnalysisViewModel

@Composable
fun PasswordAnalysisScreen(
    viewModel: PasswordAnalysisViewModel = viewModel()
) {
    val password by viewModel.password.collectAsState()
    val analysis by viewModel.analysis.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0E27))
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Text(
            "PASSWORD HUNTER",
            style = MaterialTheme.typography.headlineLarge.copy(
                fontFamily = FontFamily.Monospace,
                color = Color(0xFF00FF41),
                fontSize = 24.sp
            ),
            modifier = Modifier.padding(bottom = 24.dp)
        )

        // Input Section
        OutlinedTextField(
            value = password,
            onValueChange = viewModel::updatePassword,
            label = { Text("Enter Password", color = Color(0xFF00FF41)) },
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFF00FF41), shape = MaterialTheme.shapes.small),
            textStyle = MaterialTheme.typography.bodyMedium.copy(
                fontFamily = FontFamily.Monospace,
                color = Color(0xFF00FF41)
            ),
            enabled = !isLoading,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Analyze Button
        Button(
            onClick = { viewModel.analyzePassword() },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF00FF41),
                contentColor = Color(0xFF0A0E27)
            ),
            enabled = password.isNotEmpty() && !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    color = Color(0xFF0A0E27),
                    modifier = Modifier.size(24.dp)
                )
            } else {
                Text("ANALYZE", fontFamily = FontFamily.Monospace)
            }
        }

        // Error Message
        if (error != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFF4444))
            ) {
                Text(
                    error!!,
                    modifier = Modifier.padding(12.dp),
                    color = Color.White,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Results Section
        if (analysis != null) {
            Spacer(modifier = Modifier.height(24.dp))
            AnalysisResultsCard(analysis!!)
        }
    }
}

@Composable
fun AnalysisResultsCard(analysis: com.passwordhunter.mobile.network.PasswordAnalysis) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFF00FF41), shape = MaterialTheme.shapes.medium),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1F3A))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Score
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Strength:", fontFamily = FontFamily.Monospace, color = Color(0xFF00FF41))
                Text(
                    analysis.label,
                    fontFamily = FontFamily.Monospace,
                    color = getDifficultyColor(analysis.difficultyLevel)
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Score:", fontFamily = FontFamily.Monospace, color = Color(0xFF00FF41))
                Text(
                    "${analysis.score}/100",
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Entropy:", fontFamily = FontFamily.Monospace, color = Color(0xFF00FF41))
                Text(
                    String.format("%.2f", analysis.entropy),
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Crack Time:", fontFamily = FontFamily.Monospace, color = Color(0xFF00FF41))
                Text(
                    analysis.crackTimeDisplay,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFFFF6B6B)
                )
            }

            // Weaknesses
            if (analysis.weaknesses.isNotEmpty()) {
                Text(
                    "Weaknesses:",
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFFFFAA00),
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                analysis.weaknesses.forEach {
                    Text(
                        "• $it",
                        fontFamily = FontFamily.Monospace,
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(bottom = 2.dp)
                    )
                }
            }
        }
    }
}

fun getDifficultyColor(difficulty: String): Color = when (difficulty) {
    "Easy" -> Color(0xFF00FF41)
    "Medium" -> Color(0xFFFFAA00)
    "Hard" -> Color(0xFFFF6B35)
    "Extreme" -> Color(0xFFFF4444)
    "Impossible" -> Color(0xFFAA00FF)
    else -> Color.White
}
