package com.bagga.aiserver.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class CreateUserDto {
    @NotBlank(message = "Please provide a first name")
    private String firstName ;
    @NotBlank (message = "Please provide a last name")
    private String lastName ;
    @NotBlank(message = "Please provide a cin")
    private String cin ;
    @NotBlank(message = "Please provide an email address")
    @Email(message = "Please provide a valid email address")
    private String email ;
    @NotBlank(message = "Please provide a password")
    private String password ;
    @NotBlank(message = "Please provide a phone number")
    private String tel ;
}
