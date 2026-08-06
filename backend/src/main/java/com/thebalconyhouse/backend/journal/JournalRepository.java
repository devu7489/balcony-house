package com.thebalconyhouse.backend.journal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface JournalRepository extends JpaRepository<JournalPost, Long> {
    Optional<JournalPost> findBySlug(String slug);
}
