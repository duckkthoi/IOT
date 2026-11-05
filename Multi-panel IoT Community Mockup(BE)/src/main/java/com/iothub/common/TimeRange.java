package com.iothub.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

/**
 * Bo loc thoi gian dung chung cho UC4/UC5 (SRS B.3.3):
 * time_range = all | 1h | 3h | 6h | today | custom (custom bat buoc from/to, ISO 8601).
 * Neu time_range khac custom ma van co from/to thi bo qua from/to.
 *
 * @param from bao gom (null = khong gioi han)
 * @param to   khong bao gom (null = khong gioi han)
 */
public record TimeRange(String key, Instant from, Instant to) {

    public static TimeRange resolve(String timeRange, String from, String to, ZoneId zone) {
        String key = timeRange == null || timeRange.isBlank() ? "all" : timeRange.trim().toLowerCase(Locale.ROOT);
        Instant now = Instant.now();
        return switch (key) {
            case "all" -> new TimeRange(key, null, null);
            case "1h" -> new TimeRange(key, now.minus(1, ChronoUnit.HOURS), null);
            case "3h" -> new TimeRange(key, now.minus(3, ChronoUnit.HOURS), null);
            case "6h" -> new TimeRange(key, now.minus(6, ChronoUnit.HOURS), null);
            case "24h" -> new TimeRange(key, now.minus(24, ChronoUnit.HOURS), null);
            case "today" -> new TimeRange(key, LocalDate.now(zone).atStartOfDay(zone).toInstant(), null);
            case "custom" -> {
                if (from == null || from.isBlank() || to == null || to.isBlank()) {
                    throw ApiException.badRequest("time_range = custom bắt buộc có from và to");
                }
                Instant f = parseInstant(from, zone, "from");
                Instant t = parseInstant(to, zone, "to");
                if (!f.isBefore(t)) {
                    throw ApiException.badRequest("Thời điểm 'from' phải nhỏ hơn 'to'");
                }
                yield new TimeRange(key, f, t);
            }
            default -> throw ApiException.badRequest("time_range phải là all | 1h | 3h | 6h | today | custom");
        };
    }

    /**
     * Chap nhan ISO 8601 co mui gio ("2026-08-16T00:00:00Z", "...+07:00") hoac khong co mui gio
     * ("2026-08-16T00:00" tu o input datetime-local) - truong hop sau hieu theo mui gio he thong.
     */
    public static Instant parseInstant(String value, ZoneId zone, String name) {
        String v = value.trim();
        try {
            return OffsetDateTime.parse(v).toInstant();
        } catch (DateTimeParseException ignored) {
            // thu dinh dang khong co offset
        }
        try {
            return LocalDateTime.parse(v).atZone(zone).toInstant();
        } catch (DateTimeParseException ignored) {
            // thu dinh dang chi co ngay
        }
        try {
            return LocalDate.parse(v).atStartOfDay(zone).toInstant();
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("Tham số '" + name + "' phải theo định dạng ISO 8601");
        }
    }

    public String fromIso() {
        return from == null || !"custom".equals(key) ? null : from.toString();
    }

    public String toIso() {
        return to == null || !"custom".equals(key) ? null : to.toString();
    }
}
