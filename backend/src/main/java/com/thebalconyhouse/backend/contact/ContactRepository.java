package com.thebalconyhouse.backend.contact;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRepository extends JpaRepository<ContactEnquiry, Long> {
}
