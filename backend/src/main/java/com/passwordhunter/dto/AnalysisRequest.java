package com.passwordhunter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AnalysisRequest {

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 1, max = 200, message = "Password must be between 1 and 200 characters")
    private String password;

    public AnalysisRequest() {}

    public AnalysisRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String toString() {
        return "AnalysisRequest{password='[REDACTED]'}";
    }
}
