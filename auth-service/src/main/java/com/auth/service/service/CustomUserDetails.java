package com.auth.service.service;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

@Getter
public class CustomUserDetails implements UserDetails, OAuth2User {

    private final Long userId;
    private final Long customerId;
    private final String username;
    private final String password;
    private final String email;
    private final Boolean emailVerified;
    private final Boolean enabled;
    private final Collection<? extends GrantedAuthority> authorities;
    private final Map<String, Object> attributes;

    public CustomUserDetails(
            String username,
            String password,
            Collection<? extends GrantedAuthority> authorities,
            Long userId,
            Long customerId,
            String email,
            Boolean enabled,
            Boolean emailVerified,
            Map<String, Object> attributes
    ) {
        this.username = username;
        this.password = password;
        this.authorities = authorities;
        this.userId = userId;
        this.customerId = customerId;
        this.email = email;
        this.enabled = enabled;
        this.emailVerified = emailVerified;
        this.attributes = attributes;
    }

    // ===== OAuth2User =====
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        return username;
    }

    // ===== UserDetails =====
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
