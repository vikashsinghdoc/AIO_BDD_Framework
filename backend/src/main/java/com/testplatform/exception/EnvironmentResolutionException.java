package com.testplatform.exception;

/** Thrown when a requested environment name is unknown, or its URLs aren't configured. */
public class EnvironmentResolutionException extends RuntimeException {

    public EnvironmentResolutionException(String message) {
        super(message);
    }
}
