package com.passwordhunter.controller;

import com.passwordhunter.dto.AnalysisRequest;
import com.passwordhunter.model.PasswordAnalysis;
import com.passwordhunter.service.PasswordAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @Autowired
    private PasswordAnalysisService analysisService;

    @PostMapping
    public ResponseEntity<?> analyzePassword(@Valid @RequestBody AnalysisRequest request) {
        try {
            PasswordAnalysis analysis = analysisService.analyzePassword(request.getPassword());
            return ResponseEntity.ok().body(new ApiResponse<>(true, "Analysis successful", analysis));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(new ApiResponse<>(false, "Analysis failed", null));
        }
    }

    @Data
    @AllArgsConstructor
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class Data {}
}
