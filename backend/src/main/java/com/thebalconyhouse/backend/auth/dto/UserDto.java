package com.thebalconyhouse.backend.auth.dto;

import java.time.LocalDate;

public record UserDto(String email, String name, String pictureUrl, boolean isAdmin,
                       String phone, String gender, LocalDate dateOfBirth) {}
