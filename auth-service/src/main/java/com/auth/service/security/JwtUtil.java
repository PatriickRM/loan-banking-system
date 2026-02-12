package com.auth.service.security;

import com.auth.service.service.CustomUserDetails;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    @Value("${security.jwt.secret-key}")
    private String secret;

    @Value("${security.jwt.expiration}")
    private Long expiration;

    //Generar token
    public String generateToken(UserDetails userDetails){
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }
    //Generar token con claims adicionales
    public String generateToken(CustomUserDetails userDetails) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("userId", userDetails.getUserId());
        claims.put("email", userDetails.getEmail());
        claims.put("emailVerified", userDetails.getEmailVerified());
        claims.put(
                "roles",
                userDetails.getAuthorities()
                        .stream()
                        .map(a -> a.getAuthority())
                        .toList()
        );

        return createToken(claims, userDetails.getUsername());
    }
    //Crear token
    private String createToken(Map<String, Object>claims, String subject){
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    //Obtener la clave de firma
    private Key getSigningKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    //Extraer username del token
    public String extractUsername(String token){
        return extractClaim(token, Claims::getSubject);
    }
    // Extraer fecha de expiración
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    //Extraer claim específico
    public <T> T extractClaim(String token, Function<Claims,T> claimsResolver){
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    // Extraer todos los claims
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    // Validar si el token ha expirado
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Validar token
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Obtener tiempo de expiración en segundos
    public Long getExpirationInSeconds() {
        return expiration / 1000;
    }
}