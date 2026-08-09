package com.thebalconyhouse.backend.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

// See this block's own comment in application.yml (app.email) for the sandbox-domain caveat.
@ConfigurationProperties(prefix = "app.email")
public record EmailConfig(boolean enabled, String resendApiKey, String fromAddress) {}
