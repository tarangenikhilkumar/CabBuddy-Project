package com.cabbuddy.cabbuddybackend.controller;

import com.cabbuddy.cabbuddybackend.dto.LoginRequest;
import com.cabbuddy.cabbuddybackend.dto.LoginResponse;
import com.cabbuddy.cabbuddybackend.entity.User;
import com.cabbuddy.cabbuddybackend.repository.UserRepository;
import com.cabbuddy.cabbuddybackend.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        // 1️ Find active user
        User user = userRepository.findByEmailAndActiveTrue(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found or inactive"));

        // 2️ Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid credentials");
        }

        // 3️ Generate JWT token ( FIXED: includes userId)
        String token = jwtUtil.generateToken(
                user.getId(),            //  IMPORTANT
                user.getEmail(),
                user.getRole().name()
        );

        // 4️ Build response payload
        LoginResponse response = new LoginResponse();
        response.setId(user.getId());
        response.setToken(token);
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole().name());

        return ResponseEntity.ok(response);
    }
}
