package com.thebalconyhouse.backend.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void recordLoginSuccess(String principal) {
        save("LOGIN_SUCCESS", principal, "OAuth2 login succeeded");
        log.info("Authentication success for {}", principal);
    }

    public void recordLoginFailure(String reason) {
        save("LOGIN_FAILURE", null, reason);
        log.warn("Authentication failure: {}", reason);
    }

    public void recordLogout(String principal) {
        save("LOGOUT", principal, "User logged out");
        log.info("Logout for {}", principal);
    }

    private void save(String eventType, String principal, String detail) {
        repository.save(new AuditLog(eventType, principal, detail, Instant.now()));
    }
}
