package com.iothub.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Phan trang theo SRS B.1: page (mac dinh 1), limit (mac dinh 25), kem total.
 * total_pages la truong bo sung de Frontend ve thanh phan trang.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PageResponse<T>(
        boolean success,
        long total,
        int page,
        int limit,
        int totalPages,
        Map<String, Object> filters,
        List<T> data
) {
    public static <T> PageResponse<T> of(List<T> data, long total, PageRequest p, Map<String, Object> filters) {
        int totalPages = (int) Math.max(1, (total + p.limit() - 1) / p.limit());
        return new PageResponse<>(true, total, p.page(), p.limit(), totalPages, filters, data);
    }
}
