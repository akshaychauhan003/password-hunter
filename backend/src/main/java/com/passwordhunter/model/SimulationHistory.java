package com.passwordhunter.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "history")
public class SimulationHistory {

    @Id
    private String id;

    private String target;
    private String maskedTarget;
    private long totalAttempts;
    private long timeTakenMs;
    private String modeUsed;
    private String difficultyLabel;
    private double difficultyScore;
    private String estimatedCrackTime;
    private int charLength;
    private int charsetSize;
    private double entropy;
    private String userId;
    private LocalDateTime dateTime;

    public SimulationHistory() {}

    public SimulationHistory(String id, String target, String maskedTarget, long totalAttempts,
                              long timeTakenMs, String modeUsed, String difficultyLabel,
                              double difficultyScore, String estimatedCrackTime, int charLength,
                              int charsetSize, double entropy, String userId, LocalDateTime dateTime) {
        this.id = id;
        this.target = target;
        this.maskedTarget = maskedTarget;
        this.totalAttempts = totalAttempts;
        this.timeTakenMs = timeTakenMs;
        this.modeUsed = modeUsed;
        this.difficultyLabel = difficultyLabel;
        this.difficultyScore = difficultyScore;
        this.estimatedCrackTime = estimatedCrackTime;
        this.charLength = charLength;
        this.charsetSize = charsetSize;
        this.entropy = entropy;
        this.userId = userId;
        this.dateTime = dateTime;
    }

    // --- Builder ---
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String target;
        private String maskedTarget;
        private long totalAttempts;
        private long timeTakenMs;
        private String modeUsed;
        private String difficultyLabel;
        private double difficultyScore;
        private String estimatedCrackTime;
        private int charLength;
        private int charsetSize;
        private double entropy;
        private String userId;
        private LocalDateTime dateTime;

        public Builder id(String id) { this.id = id; return this; }
        public Builder target(String target) { this.target = target; return this; }
        public Builder maskedTarget(String maskedTarget) { this.maskedTarget = maskedTarget; return this; }
        public Builder totalAttempts(long totalAttempts) { this.totalAttempts = totalAttempts; return this; }
        public Builder timeTakenMs(long timeTakenMs) { this.timeTakenMs = timeTakenMs; return this; }
        public Builder modeUsed(String modeUsed) { this.modeUsed = modeUsed; return this; }
        public Builder difficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; return this; }
        public Builder difficultyScore(double difficultyScore) { this.difficultyScore = difficultyScore; return this; }
        public Builder estimatedCrackTime(String estimatedCrackTime) { this.estimatedCrackTime = estimatedCrackTime; return this; }
        public Builder charLength(int charLength) { this.charLength = charLength; return this; }
        public Builder charsetSize(int charsetSize) { this.charsetSize = charsetSize; return this; }
        public Builder entropy(double entropy) { this.entropy = entropy; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }
        public Builder dateTime(LocalDateTime dateTime) { this.dateTime = dateTime; return this; }

        public SimulationHistory build() {
            return new SimulationHistory(id, target, maskedTarget, totalAttempts, timeTakenMs,
                    modeUsed, difficultyLabel, difficultyScore, estimatedCrackTime,
                    charLength, charsetSize, entropy, userId, dateTime);
        }
    }

    // --- Getters / Setters ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getMaskedTarget() { return maskedTarget; }
    public void setMaskedTarget(String maskedTarget) { this.maskedTarget = maskedTarget; }

    public long getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(long totalAttempts) { this.totalAttempts = totalAttempts; }

    public long getTimeTakenMs() { return timeTakenMs; }
    public void setTimeTakenMs(long timeTakenMs) { this.timeTakenMs = timeTakenMs; }

    public String getModeUsed() { return modeUsed; }
    public void setModeUsed(String modeUsed) { this.modeUsed = modeUsed; }

    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }

    public double getDifficultyScore() { return difficultyScore; }
    public void setDifficultyScore(double difficultyScore) { this.difficultyScore = difficultyScore; }

    public String getEstimatedCrackTime() { return estimatedCrackTime; }
    public void setEstimatedCrackTime(String estimatedCrackTime) { this.estimatedCrackTime = estimatedCrackTime; }

    public int getCharLength() { return charLength; }
    public void setCharLength(int charLength) { this.charLength = charLength; }

    public int getCharsetSize() { return charsetSize; }
    public void setCharsetSize(int charsetSize) { this.charsetSize = charsetSize; }

    public double getEntropy() { return entropy; }
    public void setEntropy(double entropy) { this.entropy = entropy; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getDateTime() { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }
}
