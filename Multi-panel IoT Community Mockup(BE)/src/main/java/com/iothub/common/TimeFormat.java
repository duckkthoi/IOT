package com.iothub.common;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class TimeFormat {

    /** "2026-10-13 17:11:49" - cung dinh dang voi bang du lieu tren Frontend. */
    public static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    /** "16/08 08:00:12" - cot thoi gian trang Lich su hoat dong. */
    public static final DateTimeFormatter SHORT = DateTimeFormatter.ofPattern("dd/MM HH:mm:ss");
    public static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("HH:mm:ss");

    private TimeFormat() {
    }

    public static String format(Instant instant, DateTimeFormatter fmt, ZoneId zone) {
        return instant == null ? null : fmt.format(instant.atZone(zone));
    }

    public static Instant toInstant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }

    public static Timestamp toTimestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }
}
