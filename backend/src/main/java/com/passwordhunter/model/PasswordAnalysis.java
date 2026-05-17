package com.passwordhunter.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class PasswordAnalysis {

    private int score;
    private String label;
    private double entropy;
    private int charsetSize;
    private String crackTimeDisplay;

    @JsonProperty("charDiversity")
    private CharDiversity charDiversity;

    private List<String> weaknesses;
    private List<String> suggestions;
    private String difficultyLevel;

    public PasswordAnalysis() {}

    public PasswordAnalysis(int score, String label, double entropy, int charsetSize,
                            String crackTimeDisplay, CharDiversity charDiversity,
                            List<String> weaknesses, List<String> suggestions, String difficultyLevel) {
        this.score = score;
        this.label = label;
        this.entropy = entropy;
        this.charsetSize = charsetSize;
        this.crackTimeDisplay = crackTimeDisplay;
        this.charDiversity = charDiversity;
        this.weaknesses = weaknesses;
        this.suggestions = suggestions;
        this.difficultyLevel = difficultyLevel;
    }

    // --- Builder ---
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private int score;
        private String label;
        private double entropy;
        private int charsetSize;
        private String crackTimeDisplay;
        private CharDiversity charDiversity;
        private List<String> weaknesses;
        private List<String> suggestions;
        private String difficultyLevel;

        public Builder score(int score) { this.score = score; return this; }
        public Builder label(String label) { this.label = label; return this; }
        public Builder entropy(double entropy) { this.entropy = entropy; return this; }
        public Builder charsetSize(int charsetSize) { this.charsetSize = charsetSize; return this; }
        public Builder crackTimeDisplay(String crackTimeDisplay) { this.crackTimeDisplay = crackTimeDisplay; return this; }
        public Builder charDiversity(CharDiversity charDiversity) { this.charDiversity = charDiversity; return this; }
        public Builder weaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; return this; }
        public Builder suggestions(List<String> suggestions) { this.suggestions = suggestions; return this; }
        public Builder difficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; return this; }

        public PasswordAnalysis build() {
            return new PasswordAnalysis(score, label, entropy, charsetSize, crackTimeDisplay,
                    charDiversity, weaknesses, suggestions, difficultyLevel);
        }
    }

    // --- Getters / Setters ---
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public double getEntropy() { return entropy; }
    public void setEntropy(double entropy) { this.entropy = entropy; }

    public int getCharsetSize() { return charsetSize; }
    public void setCharsetSize(int charsetSize) { this.charsetSize = charsetSize; }

    public String getCrackTimeDisplay() { return crackTimeDisplay; }
    public void setCrackTimeDisplay(String crackTimeDisplay) { this.crackTimeDisplay = crackTimeDisplay; }

    public CharDiversity getCharDiversity() { return charDiversity; }
    public void setCharDiversity(CharDiversity charDiversity) { this.charDiversity = charDiversity; }

    public List<String> getWeaknesses() { return weaknesses; }
    public void setWeaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    // --- Nested CharDiversity ---
    public static class CharDiversity {
        private boolean hasLower;
        private boolean hasUpper;
        private boolean hasDigit;
        private boolean hasSymbol;

        public CharDiversity() {}

        public CharDiversity(boolean hasLower, boolean hasUpper, boolean hasDigit, boolean hasSymbol) {
            this.hasLower = hasLower;
            this.hasUpper = hasUpper;
            this.hasDigit = hasDigit;
            this.hasSymbol = hasSymbol;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private boolean hasLower;
            private boolean hasUpper;
            private boolean hasDigit;
            private boolean hasSymbol;

            public Builder hasLower(boolean hasLower) { this.hasLower = hasLower; return this; }
            public Builder hasUpper(boolean hasUpper) { this.hasUpper = hasUpper; return this; }
            public Builder hasDigit(boolean hasDigit) { this.hasDigit = hasDigit; return this; }
            public Builder hasSymbol(boolean hasSymbol) { this.hasSymbol = hasSymbol; return this; }

            public CharDiversity build() {
                return new CharDiversity(hasLower, hasUpper, hasDigit, hasSymbol);
            }
        }

        public boolean isHasLower() { return hasLower; }
        public void setHasLower(boolean hasLower) { this.hasLower = hasLower; }

        public boolean isHasUpper() { return hasUpper; }
        public void setHasUpper(boolean hasUpper) { this.hasUpper = hasUpper; }

        public boolean isHasDigit() { return hasDigit; }
        public void setHasDigit(boolean hasDigit) { this.hasDigit = hasDigit; }

        public boolean isHasSymbol() { return hasSymbol; }
        public void setHasSymbol(boolean hasSymbol) { this.hasSymbol = hasSymbol; }
    }
}
