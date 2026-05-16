package com.passwordhunter.controller;

import com.passwordhunter.dto.HistoryRequest;
import com.passwordhunter.model.SimulationHistory;
import com.passwordhunter.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private HistoryService historyService;

    @GetMapping
    public ResponseEntity<?> getHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String difficulty) {
        try {
            Page<SimulationHistory> results = historyService.getHistory(page, limit, search, difficulty);
            HistoryResponse response = HistoryResponse.builder()
                    .items(results.getContent())
                    .total(results.getTotalElements())
                    .page(page)
                    .limit(limit)
                    .build();
            return ResponseEntity.ok().body(new ApiResponse<>(true, response));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Failed to fetch history"));
        }
    }

    @PostMapping
    public ResponseEntity<?> saveHistory(@Valid @RequestBody HistoryRequest request) {
        try {
            SimulationHistory history = SimulationHistory.builder()
                    .target(request.getTarget())
                    .maskedTarget(request.getMaskedTarget())
                    .totalAttempts(request.getTotalAttempts())
                    .timeTakenMs(request.getTimeTakenMs())
                    .modeUsed(request.getModeUsed())
                    .difficultyLabel(request.getDifficultyLabel())
                    .difficultyScore(request.getDifficultyScore())
                    .estimatedCrackTime(request.getEstimatedCrackTime())
                    .charLength(request.getCharLength())
                    .charsetSize(request.getCharsetSize())
                    .entropy(request.getEntropy())
                    .build();

            SimulationHistory saved = historyService.saveHistory(history);
            return ResponseEntity.status(201).body(new ApiResponse<>(true, saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Failed to save history"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable String id) {
        try {
            historyService.deleteHistory(id);
            return ResponseEntity.ok().body(new ApiResponse<>(true, "History deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Failed to delete history"));
        }
    }

    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAllHistory() {
        try {
            historyService.deleteAllHistory();
            return ResponseEntity.ok().body(new ApiResponse<>(true, "All history cleared"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Failed to clear history"));
        }
    }

    @Data
    @lombok.Builder
    public static class HistoryResponse {
        private java.util.List<SimulationHistory> items;
        private long total;
        private int page;
        private int limit;
    }

    @Data
    @AllArgsConstructor
    public static class ApiResponse<T> {
        private boolean success;
        private T data;

        public ApiResponse(boolean success, String message) {
            this.success = success;
            this.data = (T) message;
        }
    }
}
