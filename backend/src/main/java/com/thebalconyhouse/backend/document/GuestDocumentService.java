package com.thebalconyhouse.backend.document;

import com.thebalconyhouse.backend.booking.BookingRepository;
import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.document.dto.GuestDocumentDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Validates and stores uploaded guest ID documents. Every upload is written under a random
 * UUID filename, never the guest-supplied original name (see GuestDocument's own comment for
 * why), and only accepted content types/sizes make it to disk at all - this is the one place
 * in the app that writes arbitrary user-supplied bytes to the filesystem, so it's also the
 * one place a mistake here (path traversal, an unbounded upload, an executable masquerading
 * as an image) would actually matter.
 */
@Service
@Transactional(readOnly = true)
public class GuestDocumentService {

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "application/pdf", ".pdf"
    );

    private final GuestDocumentRepository guestDocumentRepository;
    private final BookingRepository bookingRepository;
    private final DocumentStorageConfig config;
    private final Path storageRoot;

    public GuestDocumentService(GuestDocumentRepository guestDocumentRepository, BookingRepository bookingRepository,
                                 DocumentStorageConfig config) {
        this.guestDocumentRepository = guestDocumentRepository;
        this.bookingRepository = bookingRepository;
        this.config = config;
        this.storageRoot = Path.of(config.storagePath()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create document storage directory " + storageRoot, e);
        }
    }

    public List<GuestDocumentDto> findByBooking(Long bookingId) {
        return guestDocumentRepository.findByBookingIdOrderByUploadedAtAsc(bookingId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public GuestDocumentDto upload(Long bookingId, DocumentType documentType, MultipartFile file, String notes) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new ResourceNotFoundException("Booking " + bookingId + " not found");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a file to upload");
        }
        long maxBytes = (long) config.maxSizeMb() * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("File is too large - max " + config.maxSizeMb() + "MB");
        }
        String extension = ALLOWED_TYPES.get(file.getContentType());
        if (extension == null) {
            throw new IllegalArgumentException("Unsupported file type - upload a JPEG, PNG, WebP, or PDF");
        }

        String storedFilename = UUID.randomUUID() + extension;
        Path bookingDir = storageRoot.resolve(String.valueOf(bookingId));
        Path target = bookingDir.resolve(storedFilename);
        try {
            Files.createDirectories(bookingDir);
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not save uploaded document", e);
        }

        String originalFilename = sanitizeDisplayName(file.getOriginalFilename());
        GuestDocument saved = guestDocumentRepository.save(new GuestDocument(
                bookingId, documentType, originalFilename, storedFilename, file.getContentType(),
                file.getSize(), notes, Instant.now()
        ));
        return toDto(saved);
    }

    /** Resolved, on-disk path for a document already verified to belong to bookingId. */
    public Path resolveFile(Long bookingId, Long documentId) {
        GuestDocument doc = findOwned(bookingId, documentId);
        return storageRoot.resolve(String.valueOf(bookingId)).resolve(doc.getStoredFilename());
    }

    public GuestDocumentDto findMeta(Long bookingId, Long documentId) {
        return toDto(findOwned(bookingId, documentId));
    }

    @Transactional
    public void delete(Long bookingId, Long documentId) {
        GuestDocument doc = findOwned(bookingId, documentId);
        Path file = storageRoot.resolve(String.valueOf(bookingId)).resolve(doc.getStoredFilename());
        guestDocumentRepository.delete(doc);
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not delete document file", e);
        }
    }

    private GuestDocument findOwned(Long bookingId, Long documentId) {
        GuestDocument doc = guestDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document " + documentId + " not found"));
        if (!doc.getBookingId().equals(bookingId)) {
            throw new ResourceNotFoundException("Document " + documentId + " not found for booking " + bookingId);
        }
        return doc;
    }

    // Original filename is only ever used for display/download-as - never as a path
    // component - but still worth stripping path separators before it's shown back in the
    // UI or set as a Content-Disposition filename.
    private String sanitizeDisplayName(String name) {
        if (name == null || name.isBlank()) return "document";
        String stripped = name.replaceAll("[/\\\\]", "_");
        return stripped.length() > 255 ? stripped.substring(stripped.length() - 255) : stripped;
    }

    private GuestDocumentDto toDto(GuestDocument d) {
        return new GuestDocumentDto(d.getId(), d.getBookingId(), d.getDocumentType(), d.getOriginalFilename(),
                d.getContentType(), d.getFileSizeBytes(), d.getNotes(), d.getUploadedAt());
    }
}
