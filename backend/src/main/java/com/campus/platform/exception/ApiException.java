package com.campus.platform.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String reasonCode;

    public ApiException(HttpStatus status, String message) {
        this(status, message, status.name());
    }

    public ApiException(HttpStatus status, String message, String reasonCode) {
        super(message);
        this.status = status;
        this.reasonCode = reasonCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getReasonCode() {
        return reasonCode;
    }
}
