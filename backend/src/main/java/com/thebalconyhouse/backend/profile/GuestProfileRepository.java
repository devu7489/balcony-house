package com.thebalconyhouse.backend.profile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GuestProfileRepository extends JpaRepository<GuestProfile, Long> {
    Optional<GuestProfile> findByEmail(String email);
}
