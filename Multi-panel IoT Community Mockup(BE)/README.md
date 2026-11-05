# IoT Community Hub — Backend (Spring Boot)

Backend RESTful API + MQTT client theo tài liệu **SRS_IoT_Community_Hub (newest)**, Phụ lục B.

- Java 21+ (đang chạy tốt với JDK 24), Spring Boot 3.5, Spring Security + JWT, Spring Data JPA/JDBC
- MySQL cài trên máy (không dùng Docker) — database `iot_community_hub`
- MQTT: Eclipse Paho, 3 topic `sensor_data`, `device_control`, `device_response`
- Realtime cho Frontend: Server-Sent Events `GET /api/stream`

## Chạy

```bash
cd "Multi-panel IoT Community Mockup(BE)"
cp application-local.example.yml application-local.yml   # lần đầu: điền mật khẩu MySQL, MQTT, JWT secret
mvn spring-boot:run                        # http://localhost:3000/api
SIMULATOR_ENABLED=true mvn spring-boot:run # không cần phần cứng/broker: sinh dữ liệu giả + tự xác nhận lệnh LED
```

Swagger UI: http://localhost:3000/swagger-ui.html (bấm **Authorize**, dán `token` lấy từ `/api/auth/login`).

Khi khởi động, backend tự:
1. tạo các bảng còn thiếu (`src/main/resources/db/schema.sql`) và bổ sung cột mở rộng (xem bên dưới);
2. thêm 3 cảm biến `TEMP-01`, `LIGHT-01`, `HUM-01` và 3 LED `LED-01..03` (`db/data.sql`);
3. tạo tài khoản admin mặc định nếu chưa có: **admin / admin123** (đổi qua `PUT /api/users/me/password`).

### Cấu hình

Mật khẩu và secret không nằm trong `application.yml`. Mỗi máy tự tạo `application-local.yml`
(đã `.gitignore`, mẫu: `application-local.example.yml`) — backend tự đọc khi chạy từ thư mục BE.
Giá trị trong file này đè lên biến môi trường dạng `DB_PASSWORD`; nếu muốn dùng biến môi trường
thì bỏ dòng tương ứng trong file local (hoặc dùng `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`, `MQTT_PASSWORD`...).


| Biến | Mặc định | Ghi chú |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `3306` / `iot_community_hub` | |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / — | MySQL trên máy |
| `MQTT_BROKER_URL` | `tcp://localhost:1884` | Firmware đang trỏ tới `172.20.10.12:1884` |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | — | đặt giống firmware |
| `MQTT_ENABLED` | `true` | `false` = không kết nối broker |
| `SIMULATOR_ENABLED` | `false` | `true` = giả lập NodeMCU (không kết nối broker) |
| `FRONTEND_URL` | `http://localhost:8443` | dùng cho link quên mật khẩu / OAuth |
| `JWT_SECRET` | — | **bắt buộc**, ≥ 32 ký tự |
| `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` | — | không cấu hình thì link đặt lại mật khẩu được in ra log |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | — | redirect URI: `http://localhost:3000/api/auth/oauth/{provider}/callback` |

## API

Tất cả response JSON dùng `snake_case`; lỗi có dạng `{ "success": false, "message": "..." }`.
Endpoint (trừ nhóm auth công khai) cần header `Authorization: Bearer <token>`.

### Theo SRS (Phụ lục B)

| SRS | Method & path | Ghi chú |
|---|---|---|
| B.2.1 | `POST /api/auth/register` | 201, role = `user` |
| B.2.2 | `POST /api/auth/login` | `identifier` = email hoặc username; `remember_me` → thêm `refresh_token` 30 ngày |
| B.2.3 | `POST /api/auth/forgot-password` | luôn trả cùng một thông báo; token hết hạn sau 15 phút |
| B.2.4 | `GET /api/auth/oauth/{google\|github}` (+ `/callback`) | về FE: `{FRONTEND_URL}/oauth/callback#token=...&refresh_token=...` |
| B.3.1 | `GET /api/sensors/realtime` | `?trend=16` kèm chuỗi xu hướng; có `online`/`signal` (mất tín hiệu sau 30s) |
| B.3.2 | `GET /api/sensors/history?range=today\|week\|month&type=all\|temperature\|humidity\|light` | trung bình theo giờ (today) / ngày |
| B.3.3 | `GET /api/sensors/data?page&limit&search&status&time_range&from&to` | mỗi dòng = 1 lần gửi của thiết bị (nhiệt độ + ánh sáng + độ ẩm) |
| B.3.4 | `GET /api/sensors/data/export` | CSV (UTF-8 BOM) |
| B.4.1 | `GET /api/devices` | |
| B.4.2 | `PUT /api/devices/{id}/control` body `{ "action": "ON", "brightness": 80 }` | chờ `device_response` tối đa 5s → 200 `is_confirmed: true`, quá hạn → **408**. `?wait=false` trả ngay |
| B.4.3 | `GET /api/devices/actions?page&limit&search&device_id` | |
| B.4.4 | `GET /api/devices/actions/export` | CSV |

### Mở rộng (phục vụ FE hiện tại & firmware)

| Method & path | Mục đích |
|---|---|
| `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/reset-password`, `GET /api/auth/me` | hoàn thiện luồng đăng nhập |
| `GET /api/users/me`, `PUT /api/users/me`, `PUT /api/users/me/password` | trang Thông tin cá nhân |
| `GET /api/users`, `PATCH /api/users/{id}` (admin) | nâng quyền admin / khoá tài khoản |
| `GET /api/sensors/live?points=16` | biểu đồ LIVE trên Trang chủ |
| `GET /api/sensors/readings` (+ `/export`) | bảng từng lần đo như trang "Dữ liệu cảm biến" của FE: `type`, `search_by=auto\|id\|value\|time`, `sort=newest\|oldest\|value_desc\|value_asc\|id_asc\|id_desc\|type_asc\|type_desc` |
| `GET /api/sensors`, `PUT /api/sensors/{id}` (admin) | danh mục + chỉnh ngưỡng `min_threshold`/`max_threshold` |
| `PUT /api/devices/control-all` | bật/tắt cả 3 LED |
| `GET /api/devices/actions/{action_id}` | xem lệnh đã được xác nhận chưa |
| `GET /api/devices/actions?action&status&source&device&time_range&sort` | bộ lọc thêm cho trang Lịch sử hoạt động |
| `GET/POST/PUT/DELETE /api/schedules`, `POST /api/schedules/{id}/run` | Bộ lập lịch (cron), ghi `source = 'schedule'` |
| `GET /api/dashboard/stats` | số thiết bị, bản ghi hôm nay, cảnh báo, uptime |
| `GET /api/health` | trạng thái DB / MQTT (công khai) |
| `GET /api/stream?token=<jwt>` | SSE: `sensor_data`, `device_state`, `device_action`, `mqtt_status` |

## MQTT (SRS B.5) — khớp firmware `IoT_Community_Hub_led_manually.ino`

| Topic | Chiều | Payload |
|---|---|---|
| `sensor_data` | NodeMCU → Backend | `{ "device_mac", "readings": [{ "sensor_code", "value", "unit"? }], "timestamp" }` |
| `device_control` | Backend → NodeMCU | `{ "action_id", "device_code", "action": "ON\|OFF\|BLINK", "brightness": 0..100, "interval_ms"? }` |
| `device_response` | NodeMCU → Backend | `{ "action_id", "device_code", "status": "success\|error", "current_state", "brightness", "mode", "message"?, "timestamp" }` |

- Backend kiểm tra lệnh giống firmware trước khi gửi (brightness 0..100, BLINK cần 1..100 và `interval_ms` 100..60000).
- Phản hồi `device_code = "ALL"` được hiểu là cập nhật cả 3 LED.
- `LIGHT-01` là giá trị ADC thô (0..1023) nên đơn vị trong DB là `ADC`, không phải lux.

## Thay đổi so với thiết kế CSDL (5 bảng SRS giữ nguyên, chỉ bổ sung)

- `users`: + `oauth_provider`, `oauth_id` (SRS B.2.4 có nhắc)
- `devices`: + `mode` (`MANUAL`/`BLINK`), `blink_interval_ms`
- `device_actions`: `action` thêm `BLINK`; + `interval_ms`, `result_status` (`pending`/`success`/`failed`/`unconfirmed`), `response_message`, `confirmed_at`
- Bảng mới: `refresh_tokens`, `password_reset_tokens`, `device_schedules`

## Dọn dữ liệu thử nghiệm

```bash
mysql -uroot -p iot_community_hub < scripts/clear_test_data.sql
```
