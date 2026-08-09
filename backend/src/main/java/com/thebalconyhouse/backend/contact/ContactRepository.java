package com.thebalconyhouse.backend.contact;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContactRepository extends JpaRepository<ContactEnquiry, Long> {
    List<ContactEnquiry> findAllByOrderBySubmittedAtDesc();
}
