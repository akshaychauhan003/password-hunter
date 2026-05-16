package com.passwordhunter.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordAnalysis {
    private int score;
    private String label;
    private double entropy;
    private int charsetSize;
    private String crackTimeDisplay;
    
    @JsonProperty("charDiversity")
    private CharDiversity charDiversity;
    
    private java.util.List<String> weaknesses;
    private java.util.List<String> suggestions;
    private String difficultyLevel;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CharDiversity {
        private boolean hasLower;
        private boolean hasUpper;
        private boolean hasDigit;
        private boolean hasSymbol;
    }
}
