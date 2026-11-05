package com.iothub.common;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Ghi CSV truc tiep ra response (stream tung dong, khong giu toan bo du lieu trong bo nho).
 * Them BOM UTF-8 de Excel hien thi tieng Viet dung.
 */
public final class CsvWriter implements AutoCloseable {

    private final PrintWriter out;

    private CsvWriter(PrintWriter out) {
        this.out = out;
    }

    public static CsvWriter open(HttpServletResponse response, String baseName, ZoneId zone) {
        String stamp = LocalDateTime.now(zone).format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + baseName + "_" + stamp + ".csv\"");
        try {
            PrintWriter writer = new PrintWriter(new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8));
            writer.write('﻿');
            return new CsvWriter(writer);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public void row(Object... values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(escape(values[i]));
        }
        out.write(sb.append("\r\n").toString());
    }

    private static String escape(Object value) {
        if (value == null) return "";
        String s = value.toString();
        // Chong CSV injection khi mo bang Excel
        if (!s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0 && !s.matches("-?\\d+(\\.\\d+)?")) {
            s = "'" + s;
        }
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    @Override
    public void close() {
        out.flush();
    }
}
