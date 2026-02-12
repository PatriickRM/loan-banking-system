package com.auth.service.service;

import com.auth.service.entity.AuthProvider;
import com.auth.service.entity.Role;
import com.auth.service.entity.User;
import com.auth.service.repository.RoleRepository;
import com.auth.service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String providerId = oauth2User.getAttribute("sub");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> registerNewUser(email, name, provider, providerId));

        return new CustomUserDetails(
                user.getUsername(),
                user.getPassword() != null ? user.getPassword() : "",
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .toList(),
                user.getId(),
                user.getEmail(),
                user.getEnabled(),
                user.getEmailVerified(),
                oauth2User.getAttributes()
        );
    }
        private User registerNewUser (String email, String name, String provider, String providerId){
            User user = new User();
            user.setUsername(email.split("@")[0]);
            user.setEmail(email);
            user.setProvider(AuthProvider.valueOf(provider));
            user.setProviderId(providerId);
            user.setEnabled(true);
            user.setEmailVerified(true);

            Role clientRole = roleRepository.findByName("ROLE_CLIENT")
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            user.getRoles().add(clientRole);

            return userRepository.save(user);
        }
    }
