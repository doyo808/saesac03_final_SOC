package com.campus.platform.security;

import com.campus.platform.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(user -> new UserPrincipal(
                        user.getId(),
                        user.getEmail(),
                        user.getPasswordHash(),
                        user.getName(),
                        user.getRole()
                ))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
