package com.thebalconyhouse.backend.newsletter.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record NewsletterRequest(@NotBlank @Email String email) {}
