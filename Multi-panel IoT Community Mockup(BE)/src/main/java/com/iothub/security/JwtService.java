package com.iothub.security;

import com.iothub.config.AppProperties;
import com.iothub.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** Phat hanh va kiem tra JWT (HS256). Access token han 24h theo SRS B.2.2. */
@Service
public class JwtService {

    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_OAUTH_STATE = "oauth_state";

    private final SecretKey key;
    private final Duration accessTtl;

    public JwtService(AppProperties props) {
        byte[] secret = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) {
            throw new IllegalStateException("app.jwt.secret phai dai it nhat 32 ky tu");
        }
        this.key = Keys.hmacShaKeyFor(secret);
        this.accessTtl = props.jwt().accessTokenTtl();
    }

    public String issueAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getUserId()))
                .claim("typ", TYPE_ACCESS)
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTtl)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public long accessTtlSeconds() {
        return accessTtl.toSeconds();
    }

    /** @return user_id neu token hop le va chua het han. */
    public Optional<Integer> parseAccessToken(String token) {
        return parse(token, TYPE_ACCESS).map(c -> Integer.valueOf(c.getSubject()));
    }

    /** Tham so state cho OAuth 2.0: ky so de chong gia mao, han 10 phut. */
    public String issueOAuthState(String provider) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(provider)
                .claim("typ", TYPE_OAUTH_STATE)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofMinutes(10))))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public boolean verifyOAuthState(String state, String provider) {
        return state != null && parse(state, TYPE_OAUTH_STATE).map(c -> provider.equals(c.getSubject())).orElse(false);
    }

    private Optional<Claims> parse(String token, String expectedType) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return expectedType.equals(claims.get("typ", String.class)) ? Optional.of(claims) : Optional.empty();
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
