package com.thebalconyhouse.backend.cafe;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CafeRepository extends JpaRepository<CafeItem, Long> {
}
