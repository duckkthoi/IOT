-- ============================================================
-- IoT Community Hub - Schema MySQL (SRS muc 3.4)
-- Script idempotent: chay lai nhieu lan khong mat du lieu.
-- Cac cot mo rong (oauth_*, mode, result_status, ...) duoc
-- SchemaInitializer bo sung bang ALTER TABLE neu chua co.
-- ============================================================

-- 3.4.1 users
CREATE TABLE IF NOT EXISTS users (
  user_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username       VARCHAR(50)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(100) NULL,
  student_code   VARCHAR(20)  NULL,
  avatar_url     VARCHAR(255) NULL,
  role           ENUM('admin','user') NOT NULL DEFAULT 'user',
  status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4.2 sensors
CREATE TABLE IF NOT EXISTS sensors (
  sensor_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sensor_code    VARCHAR(30)  NOT NULL,
  sensor_name    VARCHAR(100) NOT NULL,
  sensor_type    ENUM('temperature','humidity','light') NOT NULL,
  unit           VARCHAR(10)  NOT NULL,
  location       VARCHAR(100) NULL,
  min_threshold  DECIMAL(10,2) NULL,
  max_threshold  DECIMAL(10,2) NULL,
  status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sensor_id),
  UNIQUE KEY uq_sensors_code (sensor_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4.3 devices
CREATE TABLE IF NOT EXISTS devices (
  device_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_code    VARCHAR(30)  NOT NULL,
  device_name    VARCHAR(100) NOT NULL,
  device_type    ENUM('led') NOT NULL DEFAULT 'led',
  location       VARCHAR(100) NULL,
  current_state  ENUM('ON','OFF') NOT NULL DEFAULT 'OFF',
  brightness     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id),
  UNIQUE KEY uq_devices_code (device_code),
  CONSTRAINT chk_devices_brightness CHECK (brightness BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4.4 sensor_data
CREATE TABLE IF NOT EXISTS sensor_data (
  data_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sensor_id      INT UNSIGNED NOT NULL,
  value          DECIMAL(10,2) NOT NULL,
  status         ENUM('normal','warning') NOT NULL DEFAULT 'normal',
  recorded_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (data_id),
  KEY idx_sensordata_sensor_time (sensor_id, recorded_at),
  KEY idx_sensordata_status (status),
  CONSTRAINT fk_sensordata_sensor FOREIGN KEY (sensor_id) REFERENCES sensors (sensor_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4.5 device_actions
CREATE TABLE IF NOT EXISTS device_actions (
  action_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_id      INT UNSIGNED NOT NULL,
  user_id        INT UNSIGNED NULL,
  action         ENUM('ON','OFF') NOT NULL,
  brightness     TINYINT UNSIGNED NULL,
  source         ENUM('manual','auto','schedule') NOT NULL DEFAULT 'manual',
  is_confirmed   TINYINT(1) NOT NULL DEFAULT 0,
  performed_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (action_id),
  KEY idx_deviceactions_device_time (device_id, performed_at),
  KEY idx_deviceactions_user (user_id),
  CONSTRAINT fk_deviceactions_device FOREIGN KEY (device_id) REFERENCES devices (device_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_deviceactions_user FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------- Bang bo tro (mo rong ngoai 5 bang SRS) ----------------

-- refresh_token khi remember_me = true (SRS B.2.2, han 30 ngay). Chi luu SHA-256 cua token.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  token_hash     CHAR(64) NOT NULL,
  expires_at     TIMESTAMP NOT NULL,
  revoked_at     TIMESTAMP NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_id),
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Token dat lai mat khau (SRS B.2.3, han 15 phut).
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  token_hash     CHAR(64) NOT NULL,
  expires_at     TIMESTAMP NOT NULL,
  used_at        TIMESTAMP NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_id),
  UNIQUE KEY uq_reset_token_hash (token_hash),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lich trinh dieu khien tu dong (tac nhan "Bo lap lich" - SRS 3.1). device_id NULL = tat ca LED.
CREATE TABLE IF NOT EXISTS device_schedules (
  schedule_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_id        INT UNSIGNED NULL,
  action           ENUM('ON','OFF','BLINK') NOT NULL,
  brightness       TINYINT UNSIGNED NULL,
  interval_ms      INT UNSIGNED NULL,
  cron_expression  VARCHAR(100) NOT NULL,
  description      VARCHAR(255) NULL,
  enabled          TINYINT(1) NOT NULL DEFAULT 1,
  last_run_at      TIMESTAMP NULL,
  created_by       INT UNSIGNED NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (schedule_id),
  CONSTRAINT fk_schedule_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE,
  CONSTRAINT fk_schedule_user FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
