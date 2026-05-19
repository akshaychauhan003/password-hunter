package com.passwordhunter.mobile.ui

import android.util.Log
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.passwordhunter.mobile.theme.CyberThemeColors
import kotlinx.coroutines.delay
import com.passwordhunter.mobile.network.RetrofitClient
import kotlinx.coroutines.async
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withTimeoutOrNull
import androidx.compose.ui.platform.LocalContext
import kotlin.random.Random

private val BOOT_LINES = listOf(
    "BIOS v4.7.1 ...................... [OK]" to 200L,
    "Initializing secure kernel ......... [OK]" to 350L,
    "Loading encrypted modules .......... [OK]" to 300L,
    "Mounting /sys/hunter ............... [OK]" to 400L,
    "Verifying integrity checksums ........." to 500L,
    "  ├─ core.engine      [VERIFIED ✓]" to 200L,
    "  ├─ bruteforce.wasm  [VERIFIED ✓]" to 200L,
    "  └─ crypto.module    [VERIFIED ✓]" to 200L,
    "Establishing secure terminal ........ [OK]" to 400L,
    "Bypassing firewall layers ........... [3/3]" to 350L,
    "Injecting brute-force engine ........." to 300L,
    "[ PASSWORD HUNTER v1.0.0 — READY ]" to 700L,
    "System ready. Welcome, Hunter." to 600L,
)

private const val TOTAL_BOOT_TIME_MS = 6500L // Total expected boot time
private const val BACKEND_TIMEOUT_MS = 2000L // Backend check timeout
private const val OVERALL_BOOT_TIMEOUT_MS = 8000L // Max time before we move on

@Composable
fun BootScreen(
    colors: CyberThemeColors,
    onComplete: (Boolean) -> Unit,
) {
    val lines = remember { mutableStateListOf<String>() }
    var progress by remember { mutableStateOf(0f) }
    var showCursor by remember { mutableStateOf(true) }
    var bootError by remember { mutableStateOf<String?>(null) }
    val scroll = rememberScrollState()
    val context = LocalContext.current
    val TAG = "BootScreen"

    // Single consolidated LaunchedEffect for boot sequence
    LaunchedEffect(Unit) {
        try {
            Log.d(TAG, "Boot sequence started")
            
            // Start backend check asynchronously (don't wait for it to finish)
            var isOnline = false
            val backendJob = async(Dispatchers.IO) {
                try {
                    Log.d(TAG, "Backend check starting...")
                    val api = RetrofitClient.getInstance(context)
                    val response = withTimeoutOrNull(BACKEND_TIMEOUT_MS) {
                        api.getHistory(1, 1, null, null)
                    }
                    val online = response != null
                    Log.d(TAG, "Backend check result: $online")
                    online
                } catch (e: Exception) {
                    Log.e(TAG, "Backend check failed", e)
                    false
                }
            }

            // Display boot lines with progress update
            BOOT_LINES.forEachIndexed { index, (text, lineDelay) ->
                delay(lineDelay)
                lines.add(text)
                progress = (index + 1).toFloat() / BOOT_LINES.size
                Log.d(TAG, "Boot line $index: $progress")
            }

            // Wait for backend job with timeout (don't wait longer than needed)
            val backendResult = withTimeoutOrNull(BACKEND_TIMEOUT_MS) {
                backendJob.await()
            } ?: false
            
            isOnline = backendResult
            Log.d(TAG, "Backend status determined: $isOnline")

            // Add backend status line
            if (isOnline) {
                lines.add("Backend Connection ................ [OK]")
            } else {
                lines.add("Backend unavailable — running in offline mode")
                bootError = "Backend unavailable — running in offline mode"
            }

            progress = 1.0f
            delay(1200)
            
            Log.d(TAG, "Boot sequence complete, marking booted=true, isOnline=$isOnline")
            onComplete(isOnline)
            
        } catch (e: Exception) {
            Log.e(TAG, "Boot error", e)
            bootError = "Boot error: ${e.message}"
            progress = 1.0f
            // Still complete with offline mode on error
            delay(1000)
            onComplete(false)
        }
    }

    // Separate LaunchedEffect for cursor blinking (non-critical)
    LaunchedEffect(Unit) {
        while (true) {
            delay(500)
            showCursor = !showCursor
        }
    }

    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(150),
        label = "bootProgress",
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.backgroundBoot)
            .padding(horizontal = 24.dp, vertical = 32.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                "PASSWORD HUNTER OS v1.0.0",
                color = colors.primary,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
            )
            Text(
                "[SECURE BOOT]",
                color = colors.primaryMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
            )
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(scroll),
        ) {
            lines.forEach { line ->
                val lineColor = when {
                    line.contains("READY") -> colors.secondary
                    line.contains("VERIFIED") || line.contains("[OK]") -> colors.primary.copy(alpha = 0.85f)
                    line.contains("offline") -> colors.secondary.copy(alpha = 0.8f)
                    else -> colors.primary
                }
                Text(
                    line,
                    color = lineColor,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(vertical = 1.dp),
                )
            }
            Text(
                if (showCursor) "█" else " ",
                color = colors.primary,
                fontFamily = FontFamily.Monospace,
                fontSize = 13.sp,
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Show error if present
        bootError?.let {
            Text(
                it,
                color = colors.secondary.copy(alpha = 0.8f),
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                "LOADING SYSTEM...",
                color = colors.primaryMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
            )
            Text(
                "${(animatedProgress * 100).toInt()}%",
                color = colors.secondary,
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
            )
        }

        LinearProgressIndicator(
            progress = { animatedProgress },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp)
                .height(4.dp),
            color = colors.primary,
            trackColor = colors.primaryFaint,
        )

        Text(
            "© 2024 PASSWORD HUNTER — EDUCATIONAL USE ONLY",
            color = colors.primary.copy(alpha = 0.35f),
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
        )
    }
}
