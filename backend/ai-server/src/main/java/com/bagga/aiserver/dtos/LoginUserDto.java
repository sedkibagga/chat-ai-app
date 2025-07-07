package com.bagga.aiserver.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class LoginUserDto {
    @NotBlank(message = "Please provide an email address")
    private String email ;
    @NotBlank(message = "Please provide a password")
    private String password ;
}
