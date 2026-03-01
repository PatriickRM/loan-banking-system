package com.auth.service.service;

import com.auth.service.entity.AuthProvider;
import com.auth.service.entity.Role;
import com.auth.service.entity.User;
import com.auth.service.repository.RoleRepository;
import com.auth.service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String provider   = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String email      = oauth2User.getAttribute("email");
        String name       = oauth2User.getAttribute("name");

        // ── GitHub manda "id" como Integer, Google manda "sub" como String ──
        Object idObj      = oauth2User.getAttribute("sub") != null
                ? oauth2User.getAttribute("sub")
                : oauth2User.getAttribute("id");
        String providerId = idObj != null ? String.valueOf(idObj) : null;

        // GitHub a veces no expone email público → usar login como fallback
        if (email == null) {
            String login = oauth2User.getAttribute("login");
            if (login != null) {
                email = login + "@github-noemail.local";
                log.warn("[OAuth2] GitHub no expuso email para login={}, usando placeholder", login);
            } else {
                throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
            }
        }

        // ── Nombre para GitHub (usa "login" si no hay "name") ──
        if (name == null) {
            name = oauth2User.getAttribute("login");
        }

        final String finalEmail = email;
        final String finalName  = name != null ? name : email.split("@")[0];

        // ── Buscar usuario existente o crear uno nuevo ──
        boolean isNewUser = !userRepository.existsByEmail(finalEmail);

        User user = userRepository.findByEmail(finalEmail)
                .orElseGet(() -> registerNewUser(finalEmail, finalName, provider, providerId));

        // ── Construir CustomUserDetails ──
        // needsProfile = true si es nuevo (no tiene customerId todavía)
        // El OAuth2SuccessHandler lee este flag y redirige al formulario de perfil
        boolean needsProfile = isNewUser || user.getCustomerId() == null;

        return new CustomUserDetails(
                user.getUsername(),
                user.getPassword() != null ? user.getPassword() : "",
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .distinct()
                        .toList(),
                user.getId(),
                user.getCustomerId(),
                user.getEmail(),
                user.getEnabled(),
                user.getEmailVerified(),
                oauth2User.getAttributes(),
                needsProfile   // ← nuevo campo
        );
    }

    private User registerNewUser(String email, String name, String provider, String providerId) {
        log.info("[OAuth2] Registrando nuevo usuario OAuth2: email={}, provider={}", email, provider);

        User user = new User();
        // Username = parte antes del @ limpiada, con sufijo único si existe
        String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
        String username     = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + suffix++;
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setProvider(AuthProvider.valueOf(provider));
        user.setProviderId(providerId);
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setCustomerId(null);   // ← se completa cuando llene el formulario de perfil

        Role clientRole = roleRepository.findByName("CLIENTE")
                .orElseThrow(() -> new RuntimeException("Role CLIENTE not found en BD"));

        user.getRoles().add(clientRole);
        return userRepository.save(user);
    }
}