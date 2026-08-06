package com.thebalconyhouse.backend.gallery;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GalleryRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findAllByOrderBySortOrderAsc();
}
