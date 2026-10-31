package com.hotelshivar.backend.exception;

/** Logged in, but not allowed to do this (HTTP 403), e.g. another delivery boy's order. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
