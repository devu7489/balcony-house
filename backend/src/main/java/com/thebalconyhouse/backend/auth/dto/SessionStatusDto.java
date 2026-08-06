package com.thebalconyhouse.backend.auth.dto;

public record SessionStatusDto(boolean authenticated, Long expiresInSeconds) {}
