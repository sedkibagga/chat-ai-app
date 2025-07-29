package com.bagga.aiserver.services;

import com.bagga.aiserver.config.JwtService;
import com.bagga.aiserver.dtos.CreateUserDto;
import com.bagga.aiserver.dtos.LoginUserDto;
import com.bagga.aiserver.entities.User;
import com.bagga.aiserver.repositories.UserRepository;
import com.bagga.aiserver.responses.CreateUserResponse;
import com.bagga.aiserver.responses.LoginUserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RedisService redisService;
    public CreateUserResponse createUserResponse(CreateUserDto createUserDto) {
        try {
            if (this.userRepository.findByEmail(createUserDto.getEmail()).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }
            if (this.userRepository.findByCin(createUserDto.getCin()).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cin already exists");
            }
            User user = User.builder()
                    .firstName(createUserDto.getFirstName())
                    .lastName(createUserDto.getLastName())
                    .cin(createUserDto.getCin())
                    .email(createUserDto.getEmail())
                    .password(passwordEncoder.encode(createUserDto.getPassword()))
                    .role("CLIENT")
                    .tel(createUserDto.getTel())
                    .build();
            User savedUser = this.userRepository.save(user);
            return CreateUserResponse.builder()
                    .firstName(savedUser.getFirstName())
                    .lastName(savedUser.getLastName())
                    .Cin(createUserDto.getCin())
                    .email(createUserDto.getEmail())
                    .tel(createUserDto.getTel())
                    .build();
        } catch (Exception e) {
            log.info(e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public LoginUserResponse loginUser(LoginUserDto loginUserDto) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginUserDto.getEmail(),
                            loginUserDto.getPassword()
                    )
            );

            User user = this.userRepository.findByEmail(loginUserDto.getEmail()).orElseThrow(() -> new RuntimeException("User not found"));
            String token = this.jwtService.generateToken(user);
            String refreshToken = this.jwtService.generateRefreshToken(new HashMap<>(), user);
            LoginUserResponse loginResponse = LoginUserResponse.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .cin(user.getCin())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .tel(user.getTel())
                    .token(token)
                    .refreshToken(refreshToken)
                    .build();
            this.redisService.set(user.getId(),loginResponse);
            var store = this.redisService.get(user.getId(), LoginUserResponse.class);
            log.info("Store: {}", store);
            return loginResponse;

        } catch (Exception e) {
            log.info(e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public LoginUserResponse refreshToken(String refreshToken) {
        try {
            User user = this.getUserFromValidToken(refreshToken);

            String newAccessToken = jwtService.generateToken(user);
            String newRefreshToken = jwtService.generateRefreshToken(new HashMap<>(), user);

            LoginUserResponse loginResponse = LoginUserResponse.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .cin(user.getCin())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .tel(user.getTel())
                    .token(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .build();
            this.redisService.set(user.getId(),loginResponse);
            var store = this.redisService.get(user.getId(), LoginUserResponse.class);
            log.info("Store: {}", store);
            return loginResponse;

        } catch (Exception e) {
            log.error("Error during refresh token process: {}", e.getMessage());
            throw new RuntimeException("Could not refresh token", e);
        }
    }

    private User getUserFromValidToken(String token) {
        String userEmail = jwtService.extractUsername(token);
        if (userEmail == null || userEmail.isEmpty()) {
            throw new RuntimeException("Invalid token: no email");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!jwtService.isTokenValid(token, user)) {
            throw new RuntimeException("Token is invalid or expired");
        }

        return user;
    }
}
