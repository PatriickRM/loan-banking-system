package com.auth.service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long expiresIn;
    private String username;
    private String email;
    private List<String> roles;
}