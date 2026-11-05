package com.iothub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.List;

/**
 * Tao/nang cap schema khi khoi dong (trong luc khoi tao context, truoc moi ApplicationRunner,
 * truoc ket noi MQTT va truoc khi nhan request).
 * <p>
 * 1. db/schema.sql: CREATE TABLE IF NOT EXISTS cho 5 bang SRS + bang bo tro.
 * 2. Bo sung cac cot mo rong neu chua co (MySQL khong ho tro ADD COLUMN IF NOT EXISTS).
 * 3. db/data.sql: danh muc 3 cam bien + 3 LED (INSERT IGNORE).
 */
@Component
public class SchemaInitializer implements InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(SchemaInitializer.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbc;

    public SchemaInitializer(DataSource dataSource, JdbcTemplate jdbc) {
        this.dataSource = dataSource;
        this.jdbc = jdbc;
    }

    @Override
    public void afterPropertiesSet() {
        runScript("db/schema.sql");
        applyExtensions();
        runScript("db/data.sql");
        log.info("Schema MySQL da san sang");
    }

    private void runScript(String path) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource(path));
        populator.setSqlScriptEncoding("UTF-8");
        populator.execute(dataSource);
    }

    private void applyExtensions() {
        // users: dang nhap OAuth (SRS B.2.4 - "bo sung cot oauth_provider, oauth_id")
        addColumn("users", "oauth_provider", "VARCHAR(20) NULL AFTER status");
        addColumn("users", "oauth_id", "VARCHAR(100) NULL AFTER oauth_provider");
        addIndex("users", "uq_users_oauth", "UNIQUE KEY uq_users_oauth (oauth_provider, oauth_id)");

        // devices: che do hien tai do firmware bao ve (MANUAL / BLINK)
        addColumn("devices", "mode", "ENUM('MANUAL','BLINK') NOT NULL DEFAULT 'MANUAL' AFTER brightness");
        addColumn("devices", "blink_interval_ms", "INT UNSIGNED NULL AFTER mode");

        // device_actions: firmware ho tro them BLINK + bao loi -> luu ket qua chi tiet
        if (!columnType("device_actions", "action").contains("'BLINK'")) {
            jdbc.execute("ALTER TABLE device_actions MODIFY COLUMN action ENUM('ON','OFF','BLINK') NOT NULL");
        }
        addColumn("device_actions", "interval_ms", "INT UNSIGNED NULL AFTER brightness");
        addColumn("device_actions", "result_status",
                "ENUM('pending','success','failed','unconfirmed') NOT NULL DEFAULT 'pending' AFTER is_confirmed");
        addColumn("device_actions", "response_message", "VARCHAR(255) NULL AFTER result_status");
        addColumn("device_actions", "confirmed_at", "TIMESTAMP NULL AFTER response_message");
        addIndex("device_actions", "idx_deviceactions_time", "KEY idx_deviceactions_time (performed_at)");

        // sensor_data: bang tra cuu (UC4) gom nhom theo thoi diem ghi nhan
        addIndex("sensor_data", "idx_sensordata_time", "KEY idx_sensordata_time (recorded_at)");
    }

    private void addColumn(String table, String column, String definition) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, table, column);
        if (n != null && n == 0) {
            log.info("Bo sung cot {}.{}", table, column);
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
        }
    }

    private void addIndex(String table, String index, String definition) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
                Integer.class, table, index);
        if (n != null && n == 0) {
            log.info("Tao chi muc {}.{}", table, index);
            jdbc.execute("ALTER TABLE " + table + " ADD " + definition);
        }
    }

    private String columnType(String table, String column) {
        List<String> types = jdbc.queryForList(
                "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                String.class, table, column);
        return types.isEmpty() ? "" : types.get(0);
    }
}
