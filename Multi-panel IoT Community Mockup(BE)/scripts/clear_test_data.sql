-- XOA DU LIEU THU NGHIEM (du lieu gia tu simulator, lich su lenh, lich trinh, token, user tester01).
-- Giu nguyen: danh muc sensors, devices va cac tai khoan khac.
-- Chay:  mysql -uroot -p iot_community_hub < scripts/clear_test_data.sql
DELETE FROM device_schedules;
TRUNCATE TABLE device_actions;
TRUNCATE TABLE sensor_data;
DELETE FROM refresh_tokens;
DELETE FROM password_reset_tokens;
DELETE FROM users WHERE username = 'tester01';
UPDATE devices SET current_state = 'OFF', brightness = 0, mode = 'MANUAL', blink_interval_ms = NULL;
