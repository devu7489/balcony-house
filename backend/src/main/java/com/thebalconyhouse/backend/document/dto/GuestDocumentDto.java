package com.thebalconyhouse.backend.document.dto;

import com.thebalconyhouse.backend.document.DocumentType;
import java.time.Instant;

// Deliberately excludes storedFilename (the on-disk path) - the frontend only ever needs the
// id to build a link to the authenticated download endpoint, never the raw filesystem name.
public record GuestDocumentDto(Long id, Long bookingId, DocumentType documentType, String originalFilename,
                                String contentType, long fileSizeBytes, String notes, Instant uploadedAt) {}
