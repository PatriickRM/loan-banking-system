package com.auth.service.controller;

import com.auth.service.dto.request.LoginRequest;
import com.auth.service.dto.request.RegisterRequest;
import com.auth.service.dto.response.AuthResponse;
import com.auth.service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @GetMapping("/verify")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @PutMapping("/api/auth/link-customer")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<Void> linkCustomer(@RequestParam Long customerId,
                                             Authentication auth) {
        authService.linkCustomerId(auth.getName(), customerId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerification(@RequestParam String email) {
        return ResponseEntity.ok(authService.resendVerificationEmail(email));
    }
}