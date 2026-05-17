package com.passwordhunter.controller;

import com.passwordhunter.dto.HistoryRequest;
import com.passwordhunter.model.SimulationHistory;
import com.passwordhunter.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

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
            HistoryResponse response = new HistoryResponse(
                    results.getContent(),
                    results.getTotalElements(),
                    page,
                    limit
            );
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
                    .charLength(request.getCharLength() != null ? request.getCharLength() : 0)
                    .charsetSize(request.getCharsetSize() != null ? request.getCharsetSize() : 0)
                    .entropy(request.getEntropy() != null ? request.getEntropy() : 0.0)
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

    // --- HistoryResponse ---
    public static class HistoryResponse {
        private List<SimulationHistory> items;
        private long total;
        private int page;
        private int limit;

        public HistoryResponse() {}

        public HistoryResponse(List<SimulationHistory> items, long total, int page, int limit) {
            this.items = items;
            this.total = total;
            this.page = page;
            this.limit = limit;
        }

        public List<SimulationHistory> getItems() { return items; }
        public void setItems(List<SimulationHistory> items) { this.items = items; }

        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }

        public int getPage() { return page; }
        public void setPage(int page) { this.page = page; }

        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
    }

    // --- ApiResponse ---
    public static class ApiResponse<T> {
        private boolean success;
        private T data;

        public ApiResponse() {}

        public ApiResponse(boolean success, T data) {
            this.success = success;
            this.data = data;
        }

        public ApiResponse(boolean success, String message) {
            this.success = success;
            @SuppressWarnings("unchecked")
            T cast = (T) message;
            this.data = cast;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public T getData() { return data; }
        public void setData(T data) { this.data = data; }
    }
}
