package com.thebalconyhouse.backend.document;

import org.springframework.boot.context.properties.ConfigurationProperties;

// See this block's own comment in application.yml (app.documents) for why storage-path is a
// plain local directory outside the frontend's static/public folder.
@ConfigurationProperties(prefix = "app.documents")
public record DocumentStorageConfig(String storagePath, int maxSizeMb) {}
