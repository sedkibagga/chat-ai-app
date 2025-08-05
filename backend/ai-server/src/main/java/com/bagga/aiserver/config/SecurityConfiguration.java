package com.bagga.aiserver.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfiguration {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .csrf(csrf-> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth-> auth
                        .requestMatchers("/api/login").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/refresh").permitAll()
                        .requestMatchers("/api/tts/**").permitAll()
                        .requestMatchers("/api/createAdmin").permitAll()
                        .requestMatchers("/api/zones/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/createClient").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess-> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}

