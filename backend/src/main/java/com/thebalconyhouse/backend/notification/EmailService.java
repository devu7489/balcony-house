package com.thebalconyhouse.backend.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around Resend's HTTP API (api.resend.com/emails) - no SDK dependency needed,
 * it's a single JSON POST. Deliberately swallows every failure (missing/invalid key, network
 * error, Resend outage) rather than throwing: a booking or cancellation must always succeed
 * even if the confirmation email doesn't go out. Callers never need their own try/catch.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final EmailConfig config;
    private final RestClient restClient;

    public EmailService(EmailConfig config) {
        this.config = config;
        this.restClient = RestClient.builder().baseUrl("https://api.resend.com").build();
    }

    public void send(String toEmail, String subject, String html) {
        if (!config.enabled()) {
            log.info("Email sending disabled (app.email.enabled=false) - skipped '{}' to {}", subject, toEmail);
            return;
        }
        if (config.resendApiKey() == null || config.resendApiKey().isBlank()) {
            log.warn("app.email.enabled=true but no resend-api-key configured - skipped '{}' to {}", subject, toEmail);
            return;
        }
        try {
            restClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + config.resendApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", config.fromAddress(),
                            "to", List.of(toEmail),
                            "subject", subject,
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Sent '{}' to {}", subject, toEmail);
        } catch (Exception e) {
            log.warn("Failed to send '{}' to {}: {}", subject, toEmail, e.getMessage());
        }
    }
}
