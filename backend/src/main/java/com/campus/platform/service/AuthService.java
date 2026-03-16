package com.campus.platform.service;

import com.campus.platform.domain.User;
import com.campus.platform.dto.auth.AuthTokenResponse;
import com.campus.platform.dto.auth.LoginRequest;
import com.campus.platform.dto.auth.MeResponse;
import com.campus.platform.dto.auth.RegisterRequest;
import com.campus.platform.exception.ApiException;
import com.campus.platform.repository.UserRepository;
import com.campus.platform.security.JwtTokenProvider;
import com.campus.platform.security.UserPrincipal;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseCookie.ResponseCookieBuilder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.jwt.refresh-cookie-name}")
    private String refreshCookieName;

    @Value("${app.jwt.refresh-cookie-secure}")
    private boolean refreshCookieSecure;

    @Value("${app.jwt.refresh-token-days}")
    private long refreshTokenDays;

    @Value("${app.jwt.refresh-cookie-same-site:Lax}")
    private String refreshCookieSameSite;

    @Value("${app.jwt.refresh-cookie-domain:}")
    private String refreshCookieDomain;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public MeResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name(),
                request.role()
        );
        User saved = userRepository.save(user);

        return new MeResponse(saved.getId(), saved.getEmail(), saved.getName(), saved.getRole());
    }

    @Transactional(readOnly = true)
    public AuthTokenResponse login(LoginRequest request, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials", "INVALID_CREDENTIALS"));

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);
        setRefreshCookie(response, refreshToken);

        return new AuthTokenResponse(accessToken);
    }

    @Transactional(readOnly = true)
    public AuthTokenResponse refresh(HttpServletRequest request) {
        String refreshToken = readRefreshCookie(request)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is missing", "REFRESH_COOKIE_MISSING"));

        if (!jwtTokenProvider.isValidToken(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token", "REFRESH_TOKEN_INVALID");
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found", "REFRESH_USER_NOT_FOUND"));

        return new AuthTokenResponse(jwtTokenProvider.generateAccessToken(user));
    }

    public void logout(HttpServletResponse response) {
        clearRefreshCookie(response);
    }

    @Transactional(readOnly = true)
    public MeResponse me(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found", "USER_NOT_FOUND"));
        return new MeResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    private Optional<String> readRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (refreshCookieName.equals(cookie.getName())) {
                return Optional.ofNullable(cookie.getValue());
            }
        }
        return Optional.empty();
    }

    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = buildRefreshCookie(refreshToken, Duration.ofDays(refreshTokenDays));
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = buildRefreshCookie("", Duration.ZERO);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private ResponseCookie buildRefreshCookie(String tokenValue, Duration maxAge) {
        ResponseCookieBuilder builder = ResponseCookie.from(refreshCookieName, tokenValue)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path("/")
                .sameSite(refreshCookieSameSite)
                .maxAge(maxAge);
        if (StringUtils.hasText(refreshCookieDomain)) {
            builder.domain(refreshCookieDomain.trim());
        }
        return builder.build();
    }
}
