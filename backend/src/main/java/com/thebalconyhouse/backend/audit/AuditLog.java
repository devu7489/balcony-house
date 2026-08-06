package com.thebalconyhouse.backend.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String eventType; // LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT

    private String principal; // email / subject, nullable for failures without identity

    @Column(length = 1000)
    private String detail;

    @Column(nullable = false)
    private Instant occurredAt;

    protected AuditLog() {}

    public AuditLog(String eventType, String principal, String detail, Instant occurredAt) {
        this.eventType = eventType;
        this.principal = principal;
        this.detail = detail;
        this.occurredAt = occurredAt;
    }

    public Long getId() { return id; }
    public String getEventType() { return eventType; }
    public String getPrincipal() { return principal; }
    public String getDetail() { return detail; }
    public Instant getOccurredAt() { return occurredAt; }
}
