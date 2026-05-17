package com.passwordhunter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class HistoryRequest {

    @NotBlank
    private String target;

    @NotBlank
    private String maskedTarget;

    @NotNull
    private Long totalAttempts;

    @NotNull
    private Long timeTakenMs;

    @NotBlank
    private String modeUsed;

    @NotBlank
    private String difficultyLabel;

    @NotNull
    private Double difficultyScore;

    private String estimatedCrackTime;
    private Integer charLength;
    private Integer charsetSize;
    private Double entropy;

    public HistoryRequest() {}

    public HistoryRequest(String target, String maskedTarget, Long totalAttempts, Long timeTakenMs,
                          String modeUsed, String difficultyLabel, Double difficultyScore,
                          String estimatedCrackTime, Integer charLength, Integer charsetSize, Double entropy) {
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
    }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getMaskedTarget() { return maskedTarget; }
    public void setMaskedTarget(String maskedTarget) { this.maskedTarget = maskedTarget; }

    public Long getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(Long totalAttempts) { this.totalAttempts = totalAttempts; }

    public Long getTimeTakenMs() { return timeTakenMs; }
    public void setTimeTakenMs(Long timeTakenMs) { this.timeTakenMs = timeTakenMs; }

    public String getModeUsed() { return modeUsed; }
    public void setModeUsed(String modeUsed) { this.modeUsed = modeUsed; }

    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }

    public Double getDifficultyScore() { return difficultyScore; }
    public void setDifficultyScore(Double difficultyScore) { this.difficultyScore = difficultyScore; }

    public String getEstimatedCrackTime() { return estimatedCrackTime; }
    public void setEstimatedCrackTime(String estimatedCrackTime) { this.estimatedCrackTime = estimatedCrackTime; }

    public Integer getCharLength() { return charLength; }
    public void setCharLength(Integer charLength) { this.charLength = charLength; }

    public Integer getCharsetSize() { return charsetSize; }
    public void setCharsetSize(Integer charsetSize) { this.charsetSize = charsetSize; }

    public Double getEntropy() { return entropy; }
    public void setEntropy(Double entropy) { this.entropy = entropy; }
}
