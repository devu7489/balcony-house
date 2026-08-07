package com.thebalconyhouse.backend.property;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    Optional<Property> findBySlug(String slug);
    Optional<Property> findByName(String name);
}
