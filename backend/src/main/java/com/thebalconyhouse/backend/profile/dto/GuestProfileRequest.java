package com.thebalconyhouse.backend.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public record GuestProfileRequest(
        @NotBlank
        @Pattern(regexp = "^[+]?[0-9 ()-]{7,20}$", message = "Enter a valid phone number")
        String phone,

        @Pattern(regexp = "^(MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY)?$", message = "Invalid gender value")
        String gender,

        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth
) {}
