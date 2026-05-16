package com.passwordhunter.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
