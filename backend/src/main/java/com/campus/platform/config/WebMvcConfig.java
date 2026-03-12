package com.campus.platform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final AdminNetworkAccessInterceptor adminNetworkAccessInterceptor;

    public WebMvcConfig(AdminNetworkAccessInterceptor adminNetworkAccessInterceptor) {
        this.adminNetworkAccessInterceptor = adminNetworkAccessInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminNetworkAccessInterceptor)
                .addPathPatterns("/api/lms/admin/**");
    }
}
