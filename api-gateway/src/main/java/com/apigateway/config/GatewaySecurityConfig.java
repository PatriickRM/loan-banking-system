package com.apigateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableReactiveMethodSecurity
public class GatewaySecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        // 1. Rutas públicas primero
                        .pathMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .pathMatchers(HttpMethod.GET,  "/api/auth/verify").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/auth/resend-verification").permitAll()
                        .pathMatchers("/actuator/**").permitAll()

                        // 2. CLIENTE — rutas específicas ANTES de las generales
                        .pathMatchers(HttpMethod.GET,  "/api/customers/me").hasRole("CLIENTE")
                        .pathMatchers(HttpMethod.PUT,  "/api/customers/me").hasRole("CLIENTE")
                        .pathMatchers(HttpMethod.GET,  "/api/customers/{id}")
                        .hasAnyRole("ANALISTA", "ADMIN", "CLIENTE")
                        .pathMatchers(HttpMethod.GET,  "/api/loans/my-loans").hasRole("CLIENTE")
                        .pathMatchers(HttpMethod.POST, "/api/loans").hasRole("CLIENTE")
                        .pathMatchers(HttpMethod.GET,  "/api/payments/my-payments").hasRole("CLIENTE")

                        // 3. ANALISTA y ADMIN
                        .pathMatchers(HttpMethod.GET,  "/api/customers/**").hasAnyRole("ANALISTA", "ADMIN")
                        .pathMatchers(HttpMethod.GET,  "/api/loans/**").hasAnyRole("ANALISTA", "ADMIN", "CLIENTE")
                        .pathMatchers(HttpMethod.POST, "/api/loans/{id}/approve").hasAnyRole("ANALISTA", "ADMIN")
                        .pathMatchers(HttpMethod.POST, "/api/loans/{id}/reject").hasAnyRole("ANALISTA", "ADMIN")

                        // 4. COBRANZA
                        .pathMatchers(HttpMethod.GET,  "/api/payments/**").hasAnyRole("COBRANZA", "ADMIN")
                        .pathMatchers(HttpMethod.POST, "/api/payments/**").hasAnyRole("COBRANZA", "ADMIN")
                        .pathMatchers(HttpMethod.PUT,  "/api/payments/**").hasAnyRole("COBRANZA", "ADMIN")

                        // 5. ADMIN exclusivo
                        .pathMatchers(HttpMethod.POST,   "/api/customers").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/api/customers/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.POST,   "/api/loans/{id}/disburse").hasRole("ADMIN")
                        .pathMatchers("/api/auth/users/**").hasRole("ADMIN")

                        .anyExchange().authenticated()
                )
                .addFilterAt(jwtAuthenticationFilter(), SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    @Bean
    public AuthenticationWebFilter jwtAuthenticationFilter() {
        AuthenticationWebFilter filter = new AuthenticationWebFilter(reactiveAuthenticationManager());
        filter.setServerAuthenticationConverter(exchange -> {
            String authHeader = exchange.getRequest()
                    .getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return Mono.empty();
            }

            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(
                                jwtSecret.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String username = claims.getSubject();
                List<String> roles = claims.get("roles", List.class);

                List<GrantedAuthority> authorities = roles.stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                        .collect(Collectors.toList());

                return Mono.just(new UsernamePasswordAuthenticationToken(
                        username, null, authorities));
            } catch (JwtException e) {
                return Mono.error(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Token inválido"));
            }
        });
        return filter;
    }

    @Bean
    public ReactiveAuthenticationManager reactiveAuthenticationManager() {
        return authentication -> Mono.just(authentication)
                .filter(Authentication::isAuthenticated)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED)));
    }
}