package com.bagga.aiserver.controller;

import com.bagga.aiserver.dtos.CreateUserDto;
import com.bagga.aiserver.dtos.LoginUserDto;
import com.bagga.aiserver.entities.User;
import com.bagga.aiserver.responses.CreateUserResponse;
import com.bagga.aiserver.responses.LoginUserResponse;
import com.bagga.aiserver.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public LoginUserResponse loginUser(@Valid @RequestBody LoginUserDto loginUserDto, HttpServletResponse response) {
        return this.userService.loginUser(loginUserDto, response);
    }

    @PostMapping("/refresh")
    public LoginUserResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        return this.userService.refreshToken(request, response);
    }
    @PostMapping("/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        this.userService.logout(request, response);

    }

    @GetMapping("/api/me")
    public LoginUserResponse getCurrentUser(HttpServletRequest request) {
        return this.userService.getCurrentUser(request);
    }


}
