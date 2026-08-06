package com.thebalconyhouse.backend.journal.dto;

import com.thebalconyhouse.backend.journal.JournalPost;
import java.time.Instant;

public record JournalPostDto(Long id, String slug, String title, String excerpt, String content,
                              String coverImageUrl, Instant publishedAt) {
    public static JournalPostDto summary(JournalPost p) {
        return new JournalPostDto(p.getId(), p.getSlug(), p.getTitle(), p.getExcerpt(), null,
                p.getCoverImageUrl(), p.getPublishedAt());
    }
    public static JournalPostDto full(JournalPost p) {
        return new JournalPostDto(p.getId(), p.getSlug(), p.getTitle(), p.getExcerpt(), p.getContent(),
                p.getCoverImageUrl(), p.getPublishedAt());
    }
}
