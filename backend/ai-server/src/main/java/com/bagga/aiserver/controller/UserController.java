package com.bagga.aiserver.controller;

import com.bagga.aiserver.dtos.CreateUserDto;
import com.bagga.aiserver.dtos.LoginUserDto;
import com.bagga.aiserver.responses.CreateUserResponse;
import com.bagga.aiserver.responses.LoginUserResponse;
import com.bagga.aiserver.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService ;

    @PostMapping("/createClient")
    public CreateUserResponse createUser(@Valid @RequestBody CreateUserDto createUserDto) {
        return this.userService.createUserResponse(createUserDto) ;
    }

    @PostMapping("/login")
    public LoginUserResponse loginUser(@Valid @RequestBody LoginUserDto loginUserDto, HttpServletResponse response) {
        return this.userService.loginUser(loginUserDto, response);
    }

    @PostMapping("/refresh")
    public LoginUserResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        log.info("Refreshing token");
        return this.userService.refreshToken(request, response);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        this.userService.logout(request, response);

    }

    @GetMapping("/me")
    public LoginUserResponse getCurrentUser(HttpServletRequest request) {
        return this.userService.getCurrentUser(request);
    }


}
