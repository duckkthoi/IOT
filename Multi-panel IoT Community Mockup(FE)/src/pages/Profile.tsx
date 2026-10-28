import {
  CYAN,
  CORAL,
  YELLOW,
  GREEN,
  GLASS_BDR,
  AVATAR_URL,
  AppHeader,
  Sidebar,
} from "../components/shared"

import { useAppContext } from "../context/AppContext"

function GlassTile({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  const { theme } = useAppContext()
  const isLight = theme === "light"
  return (
    <div
      style={{
        background: isLight ? "#f8fafc" : "rgba(8,20,32,0.70)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${isLight ? "#e2e8f0" : "rgba(0,200,210,0.13)"}`,
        borderTop: `2px solid ${isLight ? "#0284c7" : CYAN}`,
        borderRadius: 10,
        padding: "12px 14px",
        flex: 1,
        boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.03)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isLight ? "#0284c7" : CYAN,
            letterSpacing: 0.5,
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function InfoRow({
  label,
  value,
  href,
  color,
}: {
  label: string
  value: string
  href?: string
  color?: string
}) {
  const { theme } = useAppContext()
  const isLight = theme === "light"
  return (
    <div style={{ marginBottom: 9 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: isLight ? "#64748b" : "rgba(180,210,220,0.38)",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      {href ? (
        <a
          href={href}
          style={{
            fontSize: 12,
            color: color ?? (isLight ? "#0284c7" : CYAN),
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {value}
        </a>
      ) : (
        <span
          style={{
            fontSize: 12,
            color: color ?? (isLight ? "#1e293b" : "#eef6f8"),
            fontWeight: 500,
          }}
        >
          {value}
        </span>
      )}
    </div>
  )
}

export default function Profile() {
  const { theme } = useAppContext()
  const isLight = theme === "light"

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isLight ? "#f1f5f9" : "#060d14",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppHeader title="Thông tin cá nhân" />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <div
            style={{
              background: isLight ? "#ffffff" : "rgba(10,22,36,0.78)",
              backdropFilter: "blur(28px)",
              border: `1px solid ${isLight ? "#e2e8f0" : GLASS_BDR}`,
              borderRadius: 14,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
            }}
          >
            {/* header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: isLight ? "#0f172a" : "#eef6f8",
                    letterSpacing: -0.5,
                    marginBottom: 3,
                  }}
                >
                  Phạm Minh Đức
                </div>
                <div style={{ fontSize: 12, color: isLight ? "#0284c7" : CYAN, marginBottom: 8, fontWeight: 600 }}>
                  Sinh viên CNTT · Quản trị viên
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {[
                    "IoT",
                    "Embedded Systems",
                    "React",
                    "Spring Boot",
                    "MQTT",
                  ].map((t) => (
                    <span
                      key={t}
                      style={{
                        background: isLight ? "#e0f2fe" : "rgba(0,229,255,0.08)",
                        border: `1px solid ${isLight ? "#bae6fd" : "rgba(0,229,255,0.20)"}`,
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 9,
                        fontWeight: 700,
                        color: isLight ? "#0284c7" : CYAN,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {/* photo */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: `2px solid ${isLight ? "#0284c7" : CYAN}`,
                  boxShadow: isLight
                    ? "0 4px 12px rgba(2,132,199,0.2)"
                    : `0 0 24px rgba(0,229,255,0.22), 0 4px 20px rgba(0,0,0,0.5)`,
                  background: isLight ? "#e0f2fe" : "#0d3040",
                }}
              >
                <img
                  src={AVATAR_URL}
                  alt="Minh Đức"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                height: 1,
                background: isLight
                  ? "#e2e8f0"
                  : `linear-gradient(90deg,${CYAN}33,transparent)`,
              }}
            />

            {/* three tiles */}
            <div style={{ display: "flex", gap: 10 }}>
              <GlassTile title="Cá nhân" icon="👤">
                <InfoRow label="Họ và Tên" value="Phạm Minh Đức" />
                <InfoRow
                  label="Mã sinh viên"
                  value="B23DCCN185"
                  color={isLight ? "#d97706" : "rgba(240,192,64,0.9)"}
                />
                <InfoRow label="Khoa" value="Công nghệ thông tin" />
                <InfoRow label="Năm học" value="2026 – 2027" />
                <InfoRow label="Vai trò" value="Quản trị viên" color={isLight ? "#dc2626" : CORAL} />
              </GlassTile>

              <GlassTile title="Liên hệ" icon="🔗">
                <InfoRow
                  label="Email"
                  value="minhduc@example.com"
                  href="#"
                  color={isLight ? "#0284c7" : CYAN}
                />
                <InfoRow
                  label="Github"
                  value="github.com/minhduc-iot"
                  href="#"
                  color={isLight ? "#0284c7" : CYAN}
                />
                <InfoRow
                  label="Figma"
                  value="figma.com/@minhduc"
                  href="#"
                  color={isLight ? "#7c3aed" : "#b07aff"}
                />
                <InfoRow
                  label="Postman"
                  value="minhduc.dev"
                  href="#"
                  color={isLight ? "#dc2626" : CORAL}
                />
              </GlassTile>

              <GlassTile title="Dự án" icon="⚡">
                <InfoRow label="Tên dự án" value="IoT Community Hub" />
                <InfoRow
                  label="API Document"
                  value="Xem tài liệu API →"
                  href="#"
                  color={isLight ? "#0284c7" : CYAN}
                />
                <InfoRow label="Phiên bản" value="v2.4.1" color={isLight ? "#d97706" : YELLOW} />
                <InfoRow label="Ngày cập nhật" value="16/08/2026" />
                <InfoRow
                  label="Trạng thái"
                  value="● Đang hoạt động"
                  color={isLight ? "#16a34a" : GREEN}
                />
              </GlassTile>
            </div>

            {/* stats */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { l: "Thiết bị kết nối", v: "12", c: isLight ? "#0284c7" : CYAN },
                { l: "Dữ liệu hôm nay", v: "2,841", c: isLight ? "#d97706" : YELLOW },
                { l: "Cảnh báo", v: "3", c: isLight ? "#dc2626" : CORAL },
                { l: "Uptime", v: "99.8%", c: isLight ? "#16a34a" : GREEN },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    flex: 1,
                    background: isLight ? "#f8fafc" : "rgba(6,16,26,0.70)",
                    border: `1px solid ${isLight ? "#e2e8f0" : "rgba(0,200,210,0.10)"}`,
                    borderRadius: 9,
                    padding: "9px 12px",
                    textAlign: "center",
                    boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.02)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: s.c,
                      fontFamily: '"JetBrains Mono",monospace',
                      marginBottom: 2,
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: isLight ? "#64748b" : "rgba(180,210,220,0.38)",
                      textTransform: "uppercase",
                      letterSpacing: 0.7,
                      fontWeight: 600,
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
