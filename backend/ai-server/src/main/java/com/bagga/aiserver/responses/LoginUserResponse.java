package com.bagga.aiserver.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class LoginUserResponse {
    private String id ;
    private String token ;
    private String refreshToken ;
    private String firstName ;
    private String lastName ;
    private String cin ;
    private String email ;
    private String role;
    private String tel ;


}
