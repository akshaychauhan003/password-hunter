package com.passwordhunter.service;

import com.passwordhunter.model.PasswordAnalysis;
import com.passwordhunter.model.PasswordAnalysis.CharDiversity;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PasswordAnalysisService {
    private static final long ATTACKER_HASHES_PER_SEC = 10_000_000_000L;
    private static final Set<String> COMMON_PASSWORDS = new HashSet<>(Arrays.asList(
            "password", "123456", "qwerty", "abc123", "letmein", "monkey",
            "1234567890", "iloveyou", "admin", "welcome", "login", "pass",
            "password1", "12345678", "111111", "dragon", "master", "hello"
    ));

    public PasswordAnalysis analyzePassword(String password) {
        if (password == null || password.isEmpty()) {
            return getEmptyAnalysis();
        }

        boolean hasLower = password.matches(".*[a-z].*");
        boolean hasUpper = password.matches(".*[A-Z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSymbol = password.matches(".*[^a-zA-Z0-9].*");
        int len = password.length();

        int charsetSize = 0;
        if (hasLower) charsetSize += 26;
        if (hasUpper) charsetSize += 26;
        if (hasDigit) charsetSize += 10;
        if (hasSymbol) charsetSize += 32;
        if (charsetSize == 0) charsetSize = 26;

        double entropy = len * Math.log(charsetSize) / Math.log(2);
        double combinations = Math.pow(charsetSize, len);
        double avgSec = (combinations / 2) / ATTACKER_HASHES_PER_SEC;
        String crackTimeDisplay = formatCrackTime(avgSec);

        // Score calculation
        int score = Math.min(len * 4, 40);
        if (hasLower) score += 10;
        if (hasUpper) score += 15;
        if (hasDigit) score += 15;
        if (hasSymbol) score += 20;
        if (isCommonPassword(password)) score = Math.max(0, score - 30);
        if (hasRepeatedChars(password)) score = Math.max(0, score - 10);
        if (hasSequential(password)) score = Math.max(0, score - 10);
        score = Math.min(100, score);

        String label = score < 20 ? "Very Weak" :
                score < 40 ? "Weak" :
                        score < 60 ? "Fair" :
                        score < 80 ? "Strong" : "Very Strong";

        // Weaknesses
        List<String> weaknesses = new java.util.ArrayList<>();
        if (len < 8) weaknesses.add("Too short (< 8 characters)");
        if (!hasUpper) weaknesses.add("No uppercase letters");
        if (!hasDigit) weaknesses.add("No numbers");
        if (!hasSymbol) weaknesses.add("No special characters");
        if (hasRepeatedChars(password)) weaknesses.add("Repeated character patterns");
        if (hasSequential(password)) weaknesses.add("Sequential characters detected");
        if (isCommonPassword(password)) weaknesses.add("⚠ Common password — extremely vulnerable");

        // Suggestions
        List<String> suggestions = new java.util.ArrayList<>();
        if (len < 12) suggestions.add("Use at least 12 characters");
        if (!hasUpper) suggestions.add("Add uppercase letters (A-Z)");
        if (!hasDigit) suggestions.add("Include numbers (0-9)");
        if (!hasSymbol) suggestions.add("Add special characters (!@#$%)");
        suggestions.add("Avoid dictionary words and names");
        suggestions.add("Consider using a passphrase");

        double difficultyScore = calcDifficultyScore(password, charsetSize);
        String difficultyLevel = getDifficultyFromScore(difficultyScore);

        return PasswordAnalysis.builder()
                .score(score)
                .label(label)
                .entropy(entropy)
                .charsetSize(charsetSize)
                .crackTimeDisplay(crackTimeDisplay)
                .charDiversity(CharDiversity.builder()
                        .hasLower(hasLower)
                        .hasUpper(hasUpper)
                        .hasDigit(hasDigit)
                        .hasSymbol(hasSymbol)
                        .build())
                .weaknesses(weaknesses)
                .suggestions(suggestions)
                .difficultyLevel(difficultyLevel)
                .build();
    }

    public double calcDifficultyScore(String password, int charsetSize) {
        double logCombinations = password.length() * Math.log(charsetSize) / Math.log(10);
        return Math.min(100, Math.round((logCombinations / 15) * 100));
    }

    public String getDifficultyFromScore(double score) {
        if (score < 15) return "Easy";
        if (score < 35) return "Medium";
        if (score < 60) return "Hard";
        if (score < 85) return "Extreme";
        return "Impossible";
    }

    public String getEstimatedCrackTime(int charsetSize, int length) {
        double combinations = Math.pow(charsetSize, length);
        double avgSec = (combinations / 2) / ATTACKER_HASHES_PER_SEC;
        return formatCrackTime(avgSec);
    }

    private String formatCrackTime(double seconds) {
        if (seconds < 0.001) return "Instant";
        if (seconds < 1) return String.format("%.0f milliseconds", seconds * 1000);
        if (seconds < 60) return String.format("%.1f seconds", seconds);
        if (seconds < 3600) return String.format("%.1f minutes", seconds / 60);
        if (seconds < 86400) return String.format("%.1f hours", seconds / 3600);
        if (seconds < 2_592_000) return String.format("%.1f days", seconds / 86400);
        if (seconds < 31_536_000) return String.format("%.1f months", seconds / 2_592_000);
        if (seconds < 31_536_000_000L) return String.format("%.1f years", seconds / 31_536_000);
        double centuries = seconds / (31_536_000 * 100);
        if (centuries < 1_000_000) return String.format("%.0f centuries", centuries);
        return "Longer than the universe";
    }

    private boolean hasRepeatedChars(String pw) {
        for (int i = 0; i < pw.length() - 2; i++) {
            if (pw.charAt(i) == pw.charAt(i + 1) && pw.charAt(i) == pw.charAt(i + 2)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasSequential(String pw) {
        String l = pw.toLowerCase();
        for (int i = 0; i < l.length() - 2; i++) {
            if (l.charAt(i + 1) == l.charAt(i) + 1 &&
                    l.charAt(i + 2) == l.charAt(i) + 2) {
                return true;
            }
        }
        return false;
    }

    private boolean isCommonPassword(String pw) {
        return COMMON_PASSWORDS.contains(pw.toLowerCase());
    }

    private PasswordAnalysis getEmptyAnalysis() {
        return PasswordAnalysis.builder()
                .score(0)
                .label("Very Weak")
                .entropy(0)
                .charsetSize(0)
                .crackTimeDisplay("Instant")
                .charDiversity(CharDiversity.builder()
                        .hasLower(false)
                        .hasUpper(false)
                        .hasDigit(false)
                        .hasSymbol(false)
                        .build())
                .weaknesses(java.util.Collections.singletonList("Password is empty"))
                .suggestions(java.util.Collections.emptyList())
                .difficultyLevel("Easy")
                .build();
    }
}
