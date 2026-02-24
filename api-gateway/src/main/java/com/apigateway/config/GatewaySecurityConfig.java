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

                        // ── Públicos ──────────────────────────────────────────────
                        .pathMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .pathMatchers(HttpMethod.GET,  "/api/auth/verify").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/auth/resend-verification").permitAll()
                        .pathMatchers("/actuator/**").permitAll()

                        // ── CLIENTE ───────────────────────────────────────────────
                        // Ver sus propios datos
                        .pathMatchers(HttpMethod.GET,  "/api/customers/me").hasRole("CLIENTE")
                        .pathMatchers(HttpMethod.PUT,  "/api/customers/me").hasRole("CLIENTE")
                        // Ver sus propios préstamos
                        .pathMatchers(HttpMethod.GET,  "/api/loans/my-loans").hasRole("CLIENTE")
                        // Solicitar un préstamo
                        .pathMatchers(HttpMethod.POST, "/api/loans").hasRole("CLIENTE")
                        // Ver sus pagos
                        .pathMatchers(HttpMethod.GET,  "/api/payments/my-payments").hasRole("CLIENTE")

                        // ── ANALISTA DE CRÉDITO ───────────────────────────────────
                        // Ver todos los clientes
                        .pathMatchers(HttpMethod.GET,  "/api/customers/**").hasAnyRole("ANALISTA", "ADMIN")
                        // Ver, aprobar o rechazar préstamos
                        .pathMatchers(HttpMethod.GET,  "/api/loans/**").hasAnyRole("ANALISTA", "ADMIN")
                        .pathMatchers(HttpMethod.PUT,  "/api/loans/*/approve").hasAnyRole("ANALISTA", "ADMIN")
                        .pathMatchers(HttpMethod.PUT,  "/api/loans/*/reject").hasAnyRole("ANALISTA", "ADMIN")
                        // Ver evaluaciones crediticias
                        .pathMatchers(HttpMethod.GET,  "/api/credit-evaluations/**").hasAnyRole("ANALISTA", "ADMIN")

                        // ── AGENTE DE COBRANZA ────────────────────────────────────
                        .pathMatchers(HttpMethod.GET,  "/api/payments/**").hasAnyRole("COBRANZA", "ADMIN")
                        .pathMatchers(HttpMethod.POST, "/api/payments/*/register").hasAnyRole("COBRANZA", "ADMIN")
                        .pathMatchers(HttpMethod.PUT,  "/api/payments/*/overdue").hasAnyRole("COBRANZA", "ADMIN")

                        // ── ADMIN ─────────────────────────────────────────────────
                        // Crear/editar/eliminar clientes
                        .pathMatchers(HttpMethod.POST,   "/api/customers").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/api/customers/**").hasRole("ADMIN")
                        // Desembolsar préstamos
                        .pathMatchers(HttpMethod.PUT,  "/api/loans/*/disburse").hasRole("ADMIN")
                        // Gestión de usuarios
                        .pathMatchers("/api/auth/users/**").hasRole("ADMIN")

                        // Cualquier otra ruta requiere autenticación mínima
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