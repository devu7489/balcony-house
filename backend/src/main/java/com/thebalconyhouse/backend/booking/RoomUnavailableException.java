package com.thebalconyhouse.backend.booking;

public class RoomUnavailableException extends RuntimeException {
    public RoomUnavailableException(String message) {
        super(message);
    }
}
