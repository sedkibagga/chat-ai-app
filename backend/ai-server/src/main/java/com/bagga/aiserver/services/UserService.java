package com.bagga.aiserver.services;

import com.bagga.aiserver.config.JwtService;
import com.bagga.aiserver.dtos.CreateUserDto;
import com.bagga.aiserver.dtos.LoginUserDto;
import com.bagga.aiserver.entities.User;
import com.bagga.aiserver.repositories.UserRepository;
import com.bagga.aiserver.responses.CreateUserResponse;
import com.bagga.aiserver.responses.LoginUserResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletResponse;
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

    public LoginUserResponse loginUser(LoginUserDto loginUserDto , HttpServletResponse response) {
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
                    .refreshToken(null)
                    .build();
            this.redisService.set(refreshToken,user.getEmail());
            var store = this.redisService.get(refreshToken,String.class);
            log.info("Store: {}", store);
            Cookie cookie = new Cookie("refreshToken", refreshToken);
            cookie.setHttpOnly(true);
            cookie.setSecure(true); // Set to true in production (HTTPS only)
            cookie.setPath("/");
            cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(cookie);
            Cookie accessTokenCookie = new Cookie("accessToken", token);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(true); // Set to true in production
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(15 * 60); // 15 minutes
            response.addCookie(accessTokenCookie);

            return loginResponse;

        } catch (Exception e) {
            log.info(e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public LoginUserResponse refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        String accessToken = null;
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            throw new RuntimeException("No cookies found in request");
        }
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals("refreshToken")) {
                refreshToken = cookie.getValue();
                break;
            }
        }

        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals("accessToken")) {
                accessToken = cookie.getValue();
                break;
            }
        }

        if (accessToken == null) {
            throw new RuntimeException("Access token not found");
        }

        if (refreshToken == null) {
            throw new RuntimeException("Refresh token not found in cookie");
        }

        String userEmail = redisService.get(refreshToken, String.class);
        if (userEmail == null) {
            throw new RuntimeException("Refresh token revoked or expired");
        }

        redisService.delete(refreshToken);

        User user = getUserFromValidToken(refreshToken);
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
                .refreshToken(null)
                .build();

        redisService.set(newRefreshToken, user.getEmail());

        Cookie newCookie = new Cookie("refreshToken", newRefreshToken);
        newCookie.setHttpOnly(true);
        newCookie.setSecure(true);
        newCookie.setPath("/");
        newCookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(newCookie);
        Cookie newAccessTokenCookie = new Cookie("accessToken", newAccessToken);
        newAccessTokenCookie.setHttpOnly(true);
        newAccessTokenCookie.setSecure(true); // true in production
        newAccessTokenCookie.setPath("/");
        newAccessTokenCookie.setMaxAge(15 * 60);
        response.addCookie(newAccessTokenCookie);

        return loginResponse;
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }


        if (refreshToken != null) {
            redisService.delete(refreshToken);
        }

        Cookie clearedCookie = new Cookie("refreshToken", null);
        clearedCookie.setHttpOnly(true);
        clearedCookie.setSecure(true);
        clearedCookie.setPath("/");
        clearedCookie.setMaxAge(0);
        response.addCookie(clearedCookie);
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

    public LoginUserResponse getCurrentUser(HttpServletRequest request) {
        String token = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token == null) {
            throw new RuntimeException("Unauthorized");
        }

        User user = this.getUserFromValidToken(token);
        return LoginUserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .cin(user.getCin())
                .email(user.getEmail())
                .role(user.getRole())
                .tel(user.getTel())
                .refreshToken(null)
                .build();
    }

}
