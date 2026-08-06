package com.thebalconyhouse.backend.journal;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "journal_posts")
public class JournalPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    private String title;
    private String excerpt;

    @Column(length = 10000)
    private String content;

    private String coverImageUrl;
    private Instant publishedAt;

    protected JournalPost() {}
    public JournalPost(String slug, String title, String excerpt, String content, String coverImageUrl, Instant publishedAt) {
        this.slug = slug; this.title = title; this.excerpt = excerpt;
        this.content = content; this.coverImageUrl = coverImageUrl; this.publishedAt = publishedAt;
    }
    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getExcerpt() { return excerpt; }
    public String getContent() { return content; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public Instant getPublishedAt() { return publishedAt; }
}
