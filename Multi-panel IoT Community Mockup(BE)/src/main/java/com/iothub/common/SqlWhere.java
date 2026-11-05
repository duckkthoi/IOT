package com.iothub.common;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;

import java.util.ArrayList;
import java.util.List;

/** Ghep dieu kien WHERE/HAVING dong voi tham so dat ten (chong SQL injection). */
public final class SqlWhere {

    private final List<String> where = new ArrayList<>();
    private final List<String> having = new ArrayList<>();
    private final MapSqlParameterSource params = new MapSqlParameterSource();

    public SqlWhere where(String condition) {
        where.add(condition);
        return this;
    }

    public SqlWhere having(String condition) {
        having.add(condition);
        return this;
    }

    public SqlWhere param(String name, Object value) {
        params.addValue(name, value);
        return this;
    }

    public String whereSql() {
        return where.isEmpty() ? "" : " WHERE " + String.join(" AND ", where);
    }

    public String havingSql() {
        return having.isEmpty() ? "" : " HAVING " + String.join(" AND ", having);
    }

    public MapSqlParameterSource params() {
        return params;
    }

    /** Ap dung khoang thoi gian [from, to) len mot cot TIMESTAMP. */
    public SqlWhere timeRange(String column, TimeRange range) {
        if (range.from() != null) {
            where(column + " >= :tr_from").param("tr_from", TimeFormat.toTimestamp(range.from()));
        }
        if (range.to() != null) {
            where(column + " < :tr_to").param("tr_to", TimeFormat.toTimestamp(range.to()));
        }
        return this;
    }
}
