package com.thebalconyhouse.backend.document;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Metadata for one uploaded guest ID document (Aadhaar/Passport/etc., collected at check-in
 * per Indian hotel registration requirements). The actual file bytes never live in the
 * database or in this row - only storedFilename does, which is a random UUID name on disk
 * (see GuestDocumentService), never the guest-supplied original filename. That keeps a
 * malicious or accidental filename (path separators, ".." segments, a name colliding with
 * another upload) from ever reaching the filesystem path we write to.
 */
@Entity
@Table(name = "guest_documents")
public class GuestDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookingId;

    @Enumerated(EnumType.STRING)
    private DocumentType documentType;

    @Column(length = 255)
    private String originalFilename;

    @Column(length = 100)
    private String storedFilename;

    @Column(length = 100)
    private String contentType;

    private long fileSizeBytes;

    @Column(length = 500)
    private String notes;

    private Instant uploadedAt;

    protected GuestDocument() {}

    public GuestDocument(Long bookingId, DocumentType documentType, String originalFilename, String storedFilename,
                          String contentType, long fileSizeBytes, String notes, Instant uploadedAt) {
        this.bookingId = bookingId;
        this.documentType = documentType;
        this.originalFilename = originalFilename;
        this.storedFilename = storedFilename;
        this.contentType = contentType;
        this.fileSizeBytes = fileSizeBytes;
        this.notes = notes;
        this.uploadedAt = uploadedAt;
    }

    public Long getId() { return id; }
    public Long getBookingId() { return bookingId; }
    public DocumentType getDocumentType() { return documentType; }
    public String getOriginalFilename() { return originalFilename; }
    public String getStoredFilename() { return storedFilename; }
    public String getContentType() { return contentType; }
    public long getFileSizeBytes() { return fileSizeBytes; }
    public String getNotes() { return notes; }
    public Instant getUploadedAt() { return uploadedAt; }
}
