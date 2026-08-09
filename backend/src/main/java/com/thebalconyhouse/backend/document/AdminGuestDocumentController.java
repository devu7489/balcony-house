package com.thebalconyhouse.backend.document;

import com.thebalconyhouse.backend.document.dto.GuestDocumentDto;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

/**
 * Requires ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")) - this is the
 * ONLY way a guest ID document is ever reachable over HTTP. There is deliberately no public
 * or guest-facing endpoint for these; see GuestDocument's own comment.
 */
@RestController
@RequestMapping("/api/admin/bookings/{bookingId}/documents")
public class AdminGuestDocumentController {

    private final GuestDocumentService guestDocumentService;

    public AdminGuestDocumentController(GuestDocumentService guestDocumentService) {
        this.guestDocumentService = guestDocumentService;
    }

    @GetMapping
    public List<GuestDocumentDto> list(@PathVariable Long bookingId) {
        return guestDocumentService.findByBooking(bookingId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GuestDocumentDto upload(@PathVariable Long bookingId,
                                    @RequestParam("file") MultipartFile file,
                                    @RequestParam("documentType") DocumentType documentType,
                                    @RequestParam(value = "notes", required = false) String notes) {
        return guestDocumentService.upload(bookingId, documentType, file, notes);
    }

    @GetMapping("/{documentId}/file")
    public ResponseEntity<Resource> download(@PathVariable Long bookingId, @PathVariable Long documentId) {
        GuestDocumentDto meta = guestDocumentService.findMeta(bookingId, documentId);
        Path path = guestDocumentService.resolveFile(bookingId, documentId);
        Resource resource = new FileSystemResource(path);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.contentType() != null ? meta.contentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(meta.originalFilename() != null ? meta.originalFilename() : "document").build().toString())
                .body(resource);
    }

    @DeleteMapping("/{documentId}")
    public void delete(@PathVariable Long bookingId, @PathVariable Long documentId) {
        guestDocumentService.delete(bookingId, documentId);
    }
}
