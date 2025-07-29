package com.bagga.aiserver.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class CreateUserResponse {
    private String firstName ;
    private String lastName ;
    private String Cin ;
    private String email ;
    private String tel ;
}
