package com.bagga.aiserver.controller;

import com.bagga.aiserver.dtos.CreateUserDto;
import com.bagga.aiserver.dtos.LoginUserDto;
import com.bagga.aiserver.responses.CreateUserResponse;
import com.bagga.aiserver.responses.LoginUserResponse;
import com.bagga.aiserver.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService ;
    //    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/createClient")
    public CreateUserResponse createUser(@Valid @RequestBody CreateUserDto createUserDto) {
        return this.userService.createUserResponse(createUserDto) ;
    }
    @PostMapping("/login")
    public LoginUserResponse loginUser(@Valid  @RequestBody LoginUserDto loginUserDto) {
        return this.userService.loginUser(loginUserDto) ;
    }
}
