package com.auth.service.service.impl;


import com.auth.service.dto.request.LoginRequest;
import com.auth.service.dto.request.RegisterRequest;
import com.auth.service.dto.response.AuthResponse;
import com.auth.service.entity.AuthProvider;
import com.auth.service.entity.Role;
import com.auth.service.entity.User;
import com.auth.service.entity.VerificationToken;
import com.auth.service.repository.RoleRepository;
import com.auth.service.repository.UserRepository;
import com.auth.service.repository.VerificationTokenRepository;
import com.auth.service.security.JwtUtil;
import com.auth.service.service.AuthService;
import com.auth.service.service.CustomUserDetails;
import com.auth.service.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!user.getEmailVerified()) {
            throw new RuntimeException("Email no verificado. Revisa tu bandeja de entrada.");
        }

        if (!user.getEnabled()) {
            throw new RuntimeException("Cuenta deshabilitada");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();

        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(
                token,
                jwtUtil.getExpirationInSeconds(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles()
                        .stream()
                        .map(Role::getName)
                        .collect(Collectors.toList())
        );
    }

    @Override
    @Transactional
    public String register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("El username ya existe");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCustomerId(request.getCustomerId());
        user.setProvider(AuthProvider.LOCAL);
        user.setEnabled(false);
        user.setEmailVerified(false);

        Role clientRole = roleRepository.findByName("ROLE_CLIENT")
                .orElseThrow(() -> new RuntimeException("Role no encontrado"));

        user.getRoles().add(clientRole);
        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken =
                new VerificationToken(user, token);

        tokenRepository.save(verificationToken);
        emailService.sendVerificationEmail(user, token);

        return "Registro exitoso. Revisa tu email para verificar tu cuenta.";
    }

    @Override
    @Transactional
    public String verifyEmail(String token) {

        VerificationToken verificationToken =
                tokenRepository.findByToken(token)
                        .orElseThrow(() -> new RuntimeException("Token inválido"));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(verificationToken);
            throw new RuntimeException(
                    "Token expirado. Solicita un nuevo email de verificación."
            );
        }

        User user = verificationToken.getUser();
        user.setEnabled(true);
        user.setEmailVerified(true);
        userRepository.save(user);

        tokenRepository.delete(verificationToken);

        return "Email verificado exitosamente. Ya puedes iniciar sesión.";
    }

    @Override
    @Transactional
    public String resendVerificationEmail(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (user.getEmailVerified()) {
            throw new RuntimeException("El email ya está verificado");
        }

        tokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken =
                new VerificationToken(user, token);

        tokenRepository.save(verificationToken);
        emailService.sendVerificationEmail(user, token);

        return "Email de verificación reenviado.";
    }
}
