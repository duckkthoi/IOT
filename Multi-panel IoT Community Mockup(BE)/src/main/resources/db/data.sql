-- Du lieu danh muc ban dau. INSERT IGNORE: khong ghi de khi da ton tai (theo khoa UNIQUE).
-- Thu tu TEMP -> LIGHT -> HUM khop voi response mau cua /api/sensors/realtime.
-- LIGHT-01: firmware gui gia tri ADC tho (0..1023) tu module LDR, KHONG phai lux.
-- Nguong canh bao co the chinh qua PUT /api/sensors/{id}.
INSERT IGNORE INTO sensors (sensor_code, sensor_name, sensor_type, unit, location, min_threshold, max_threshold) VALUES
  ('TEMP-01',  'Cảm biến nhiệt độ (DHT11)', 'temperature', '°C',  'Phòng thực nghiệm', 15.00, 35.00),
  ('LIGHT-01', 'Quang trở (LDR)',           'light',       'ADC', 'Phòng thực nghiệm', 100.00, 900.00),
  ('HUM-01',   'Cảm biến độ ẩm (DHT11)',    'humidity',    '%',   'Phòng thực nghiệm', 30.00, 80.00);

-- 3 LED theo firmware: LED-01 (D2), LED-02 (D6), LED-03 (D7)
INSERT IGNORE INTO devices (device_code, device_name, device_type, location, current_state, brightness) VALUES
  ('LED-01', 'LED 1', 'led', 'Phòng thực nghiệm', 'OFF', 0),
  ('LED-02', 'LED 2', 'led', 'Phòng thực nghiệm', 'OFF', 0),
  ('LED-03', 'LED 3', 'led', 'Phòng thực nghiệm', 'OFF', 0);
