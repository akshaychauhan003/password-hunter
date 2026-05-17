package com.passwordhunter.mobile.theme

import androidx.compose.ui.graphics.Color

/** Theme ids aligned with website: hacker-green, cyber-blue, neon-purple, red-matrix */
enum class CyberThemeId(val storageKey: String, val label: String) {
    HACKER_GREEN("hacker-green", "HACKER GREEN"),
    CYBER_BLUE("cyber-blue", "CYBER BLUE"),
    NEON_PURPLE("neon-purple", "NEON PURPLE"),
    RED_MATRIX("red-matrix", "RED MATRIX");

    companion object {
        val DEFAULT = HACKER_GREEN

        fun fromStorageKey(key: String?): CyberThemeId =
            entries.find { it.storageKey == key } ?: DEFAULT
    }
}

data class CyberThemeColors(
    val id: CyberThemeId,
    val primary: Color,
    val primaryMuted: Color,
    val primaryFaint: Color,
    val secondary: Color,
    val accent: Color,
    val danger: Color,
    val background: Color,
    val backgroundCard: Color,
    val backgroundTerminal: Color,
    val backgroundBoot: Color,
    val border: Color,
    val textMuted: Color,
) {
    companion object {
        fun forTheme(id: CyberThemeId): CyberThemeColors = when (id) {
            CyberThemeId.HACKER_GREEN -> CyberThemeColors(
                id = id,
                primary = Color(0xFF00FF41),
                primaryMuted = Color(0x8000FF41),
                primaryFaint = Color(0x1500FF41),
                secondary = Color(0xFF00FFFF),
                accent = Color(0xFFFFBB00),
                danger = Color(0xFFFF2020),
                background = Color(0xFF050A0E),
                backgroundCard = Color(0xFF0D1117),
                backgroundTerminal = Color(0xFF080D10),
                backgroundBoot = Color(0xFF000000),
                border = Color(0x3000FF41),
                textMuted = Color(0x66FFFFFF),
            )
            CyberThemeId.CYBER_BLUE -> CyberThemeColors(
                id = id,
                primary = Color(0xFF0080FF),
                primaryMuted = Color(0x800080FF),
                primaryFaint = Color(0x150080FF),
                secondary = Color(0xFF00FFFF),
                accent = Color(0xFFFFBB00),
                danger = Color(0xFFFF4040),
                background = Color(0xFF030810),
                backgroundCard = Color(0xFF0A1220),
                backgroundTerminal = Color(0xFF060C18),
                backgroundBoot = Color(0xFF000000),
                border = Color(0x300080FF),
                textMuted = Color(0x66FFFFFF),
            )
            CyberThemeId.NEON_PURPLE -> CyberThemeColors(
                id = id,
                primary = Color(0xFFB44FFF),
                primaryMuted = Color(0x80B44FFF),
                primaryFaint = Color(0x15B44FFF),
                secondary = Color(0xFFFF44FF),
                accent = Color(0xFFFFBB00),
                danger = Color(0xFFFF2060),
                background = Color(0xFF080510),
                backgroundCard = Color(0xFF120A1E),
                backgroundTerminal = Color(0xFF0A0614),
                backgroundBoot = Color(0xFF000000),
                border = Color(0x30B44FFF),
                textMuted = Color(0x66FFFFFF),
            )
            CyberThemeId.RED_MATRIX -> CyberThemeColors(
                id = id,
                primary = Color(0xFFFF2020),
                primaryMuted = Color(0x80FF2020),
                primaryFaint = Color(0x15FF2020),
                secondary = Color(0xFFFFBB00),
                accent = Color(0xFF00FF41),
                danger = Color(0xFFFF0000),
                background = Color(0xFF0A0303),
                backgroundCard = Color(0xFF140808),
                backgroundTerminal = Color(0xFF0C0505),
                backgroundBoot = Color(0xFF000000),
                border = Color(0x30FF2020),
                textMuted = Color(0x66FFFFFF),
            )
        }
    }
}
