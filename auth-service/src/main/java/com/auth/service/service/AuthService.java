package com.auth.service.service;


import com.auth.service.dto.request.LoginRequest;
import com.auth.service.dto.request.RegisterRequest;
import com.auth.service.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    String register(RegisterRequest request);
    String verifyEmail(String token);
    String resendVerificationEmail(String email);
}