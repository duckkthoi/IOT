package com.iothub.common;

/** Dinh dang phan hoi loi chung: { "success": false, "message": "Mo ta loi" }. */
public record ErrorResponse(boolean success, String message) {
    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message);
    }
}
