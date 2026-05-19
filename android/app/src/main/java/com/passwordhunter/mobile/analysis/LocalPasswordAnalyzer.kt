package com.passwordhunter.mobile.analysis

import com.passwordhunter.mobile.network.CharDiversity
import com.passwordhunter.mobile.network.PasswordAnalysis
import kotlin.math.ln
import kotlin.math.pow

/**
 * Client-side password analysis mirroring lib/passwordAnalyzer.ts for offline mode.
 */
object LocalPasswordAnalyzer {

    private const val ATTACKER_HASHES_PER_SEC = 10_000_000_000.0

    private val COMMON_PASSWORDS = setOf(
        "password", "123456", "qwerty", "abc123", "letmein", "monkey",
        "1234567890", "iloveyou", "admin", "welcome", "login", "pass",
        "password1", "12345678", "111111", "dragon", "master", "hello",
    )

    fun analyse(password: String): PasswordAnalysis {
        if (password.isEmpty()) return emptyAnalysis()

        val hasLower = password.any { it.isLowerCase() }
        val hasUpper = password.any { it.isUpperCase() }
        val hasDigit = password.any { it.isDigit() }
        val hasSymbol = password.any { !it.isLetterOrDigit() }
        val len = password.length

        var charsetSize = 0
        if (hasLower) charsetSize += 26
        if (hasUpper) charsetSize += 26
        if (hasDigit) charsetSize += 10
        if (hasSymbol) charsetSize += 32
        if (charsetSize == 0) charsetSize = 26

        val entropy = len * ln(charsetSize.toDouble()) / ln(2.0)
        val combinations = charsetSize.toDouble().pow(len)
        val avgSec = (combinations / 2.0) / ATTACKER_HASHES_PER_SEC
        val crackTimeDisplay = formatCrackTime(avgSec)

        var score = minOf(len * 4, 40)
        if (hasLower) score += 10
        if (hasUpper) score += 15
        if (hasDigit) score += 15
        if (hasSymbol) score += 20
        if (isCommonPassword(password)) score = maxOf(0, score - 30)
        if (hasRepeatedChars(password)) score = maxOf(0, score - 10)
        if (hasSequential(password)) score = maxOf(0, score - 10)
        score = minOf(100, score)

        val label = when {
            score < 20 -> "Very Weak"
            score < 40 -> "Weak"
            score < 60 -> "Fair"
            score < 80 -> "Strong"
            else -> "Very Strong"
        }

        val weaknesses = mutableListOf<String>()
        if (len < 8) weaknesses.add("Too short (< 8 characters)")
        if (!hasUpper) weaknesses.add("No uppercase letters")
        if (!hasDigit) weaknesses.add("No numbers")
        if (!hasSymbol) weaknesses.add("No special characters")
        if (hasRepeatedChars(password)) weaknesses.add("Repeated character patterns")
        if (hasSequential(password)) weaknesses.add("Sequential characters detected")
        if (isCommonPassword(password)) weaknesses.add("Common password — extremely vulnerable")

        val suggestions = mutableListOf<String>()
        if (len < 12) suggestions.add("Use at least 12 characters")
        if (!hasUpper) suggestions.add("Add uppercase letters (A-Z)")
        if (!hasDigit) suggestions.add("Include numbers (0-9)")
        if (!hasSymbol) suggestions.add("Add special characters (!@#$%)")
        suggestions.add("Avoid dictionary words and names")
        suggestions.add("Consider using a passphrase")

        val difficultyLevel = getDifficultyFromScore(calcDifficultyScore(password, charsetSize))

        return PasswordAnalysis(
            score = score,
            label = label,
            entropy = entropy,
            charsetSize = charsetSize,
            crackTimeDisplay = crackTimeDisplay,
            charDiversity = CharDiversity(hasLower, hasUpper, hasDigit, hasSymbol),
            weaknesses = weaknesses,
            suggestions = suggestions,
            difficultyLevel = difficultyLevel,
        )
    }

    private fun calcDifficultyScore(password: String, charsetSize: Int): Int {
        val logCombinations = password.length * kotlin.math.log10(charsetSize.toDouble())
        return minOf(100, ((logCombinations / 15.0) * 100).toInt())
    }

    private fun getDifficultyFromScore(score: Int): String = when {
        score < 15 -> "Easy"
        score < 35 -> "Medium"
        score < 60 -> "Hard"
        score < 85 -> "Extreme"
        else -> "Impossible"
    }

    private fun formatCrackTime(seconds: Double): String = when {
        seconds < 0.001 -> "Instant"
        seconds < 1 -> "${(seconds * 1000).toInt()} milliseconds"
        seconds < 60 -> "${"%.1f".format(seconds)} seconds"
        seconds < 3600 -> "${"%.1f".format(seconds / 60)} minutes"
        seconds < 86400 -> "${"%.1f".format(seconds / 3600)} hours"
        seconds < 2_592_000 -> "${"%.1f".format(seconds / 86400)} days"
        seconds < 31_536_000 -> "${"%.1f".format(seconds / 2_592_000)} months"
        seconds < 31_536_000_000 -> "${"%.1f".format(seconds / 31_536_000)} years"
        else -> {
            val centuries = seconds / (31_536_000.0 * 100)
            if (centuries < 1_000_000) "${centuries.toInt()} centuries" else "Longer than the universe"
        }
    }

    private fun hasRepeatedChars(pw: String): Boolean {
        for (i in 0 until pw.length - 2) {
            if (pw[i] == pw[i + 1] && pw[i] == pw[i + 2]) return true
        }
        return false
    }

    private fun hasSequential(pw: String): Boolean {
        val l = pw.lowercase()
        for (i in 0 until l.length - 2) {
            if (l[i + 1].code == l[i].code + 1 && l[i + 2].code == l[i].code + 2) return true
        }
        return false
    }

    private fun isCommonPassword(pw: String): Boolean = COMMON_PASSWORDS.contains(pw.lowercase())

    private fun emptyAnalysis() = PasswordAnalysis(
        score = 0,
        label = "None",
        entropy = 0.0,
        charsetSize = 0,
        crackTimeDisplay = "Instant",
        charDiversity = CharDiversity(false, false, false, false),
        weaknesses = listOf("No password entered"),
        suggestions = listOf("Enter a password to analyse"),
        difficultyLevel = "Easy",
    )
}
