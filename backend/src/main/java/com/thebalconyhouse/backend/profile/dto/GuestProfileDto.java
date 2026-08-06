package com.thebalconyhouse.backend.profile.dto;

import java.time.LocalDate;

public record GuestProfileDto(String email, String phone, String gender, LocalDate dateOfBirth) {}
