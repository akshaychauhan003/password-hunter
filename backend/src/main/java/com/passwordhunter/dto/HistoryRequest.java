package com.passwordhunter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
}
