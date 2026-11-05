package com.iothub.common;

/** page bat dau tu 1; limit gioi han 1..500 de tranh truy van qua lon. */
public record PageRequest(int page, int limit) {

    public static final int DEFAULT_LIMIT = 25;
    public static final int MAX_LIMIT = 500;

    public static PageRequest of(Integer page, Integer limit) {
        int p = page == null || page < 1 ? 1 : page;
        int l = limit == null || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
        return new PageRequest(p, l);
    }

    public long offset() {
        return (long) (page - 1) * limit;
    }
}
