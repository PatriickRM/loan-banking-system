package com.auth.service.security;

import com.auth.service.service.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);

        String redirectUrl;

        if (userDetails.isNeedsProfile()) {
            // ── Usuario nuevo OAuth2: redirigir a completar perfil ──
            // El frontend muestra el formulario de registro de datos personales
            // y al guardarlo llama /api/auth/link-customer para asignar el customerId
            log.info("[OAuth2] Usuario nuevo sin perfil: {} → redirigiendo a complete-profile", userDetails.getEmail());
            redirectUrl = frontendUrl + "/auth/complete-profile"
                    + "?token=" + token
                    + "&expiresIn=" + jwtUtil.getExpirationInSeconds();
        } else {
            // ── Usuario existente: flujo normal ──
            log.info("[OAuth2] Login exitoso: {} → redirigiendo a oauth2/redirect", userDetails.getEmail());
            redirectUrl = frontendUrl + "/auth/oauth2/redirect"
                    + "?token=" + token
                    + "&expiresIn=" + jwtUtil.getExpirationInSeconds();
        }

        response.sendRedirect(redirectUrl);
    }
}