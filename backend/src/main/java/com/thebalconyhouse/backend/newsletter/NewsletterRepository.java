package com.thebalconyhouse.backend.newsletter;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NewsletterRepository extends JpaRepository<NewsletterSubscriber, Long> {
    Optional<NewsletterSubscriber> findByEmail(String email);
    List<NewsletterSubscriber> findAllByOrderBySubscribedAtDesc();
}
