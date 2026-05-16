package com.passwordhunter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisRequest {
    @NotBlank(message = "Password cannot be empty")
    @Size(min = 1, max = 200, message = "Password must be between 1 and 200 characters")
    private String password;
}
