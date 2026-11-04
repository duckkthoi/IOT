import { NavLink } from "react-router"
import { useAppContext } from "../context/AppContext"

export const CYAN = "#00e5ff"
export const CORAL = "#ff6b6b"
export const YELLOW = "#ffd166"
export const VIOLET = "#b07aff"
export const GREEN = "#27c93f"
export const MONO = '"JetBrains Mono",monospace'
const TEAL_HDR = "#0d3d3d"
export const GLASS = "rgba(13,45,60,0.52)"
export const GLASS_BDR = "rgba(0,229,255,0.14)"

export const AVATAR_URL =
  "https://images.unsplash.com/photo-1618593706014-06782cd3bb3b?w=80&h=80&fit=crop&auto=format"

/* ── app header ──────────────────────────────────────────────── */
export function AppHeader({ title }: { title: string }) {
  const { theme, toggleTheme } = useAppContext()
  const isLight = theme === 'light'

  return (
    <div
      style={{
        background: isLight
          ? "linear-gradient(90deg, #0e7490 0%, #0284c7 100%)"
          : `linear-gradient(90deg, ${TEAL_HDR} 0%, #0a2a2a 100%)`,
        borderBottom: isLight
          ? "1px solid rgba(255,255,255,0.15)"
          : `1px solid rgba(0,229,255,0.2)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: 50,
        flexShrink: 0,
        boxShadow: isLight ? "0 2px 10px rgba(2,132,199,0.15)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 4,
            height: 26,
            borderRadius: 2,
            background: isLight
              ? `linear-gradient(180deg, #fff, #ffd166)`
              : `linear-gradient(180deg,${CYAN},${CORAL})`,
          }}
        />
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 0.3,
          }}
        >
          {title}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          title={isLight ? "Chuyển sang giao diện Tối" : "Chuyển sang giao diện Sáng"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: isLight ? "rgba(255,255,255,0.2)" : "rgba(0,229,255,0.15)",
            border: `1px solid ${isLight ? "rgba(255,255,255,0.35)" : "rgba(0,229,255,0.3)"}`,
            borderRadius: 20,
            padding: "4px 10px",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter,sans-serif",
            transition: "all .2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          <span>{isLight ? "🌙 Giao diện tối" : "☀️ Giao diện sáng"}</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>
              Minh Đức
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>
              Quản trị viên
            </div>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `2px solid ${isLight ? "#fff" : CYAN}`,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: isLight
                ? "0 0 8px rgba(255,255,255,0.4)"
                : `0 0 10px rgba(0,229,255,0.3)`,
              background: "#0d3040",
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
      </div>
    </div>
  )
}

/* ── sidebar ─────────────────────────────────────────────────── */
const NAV = [
  { icon: "⌂", to: "/", label: "Trang chủ" },
  { icon: "◈", to: "/sensor", label: "Dữ liệu cảm biến" },
  { icon: "⊟", to: "/history", label: "Lịch sử hoạt động" },
  { icon: "◉", to: "/profile", label: "Thông tin cá nhân" },
]

export function Sidebar() {
  const { theme } = useAppContext()
  const isLight = theme === 'light'

  return (
    <div
      style={{
        width: 196,
        flexShrink: 0,
        background: isLight ? "#ffffff" : "rgba(8,22,30,0.82)",
        borderRight: isLight ? "1px solid #e2e8f0" : `1px solid ${GLASS_BDR}`,
        display: "flex",
        flexDirection: "column",
        padding: "14px 10px",
        boxShadow: isLight ? "2px 0 10px rgba(0,0,0,0.02)" : "none",
        transition: "all .2s",
      }}
    >
      {/* logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "6px 10px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: isLight
              ? "linear-gradient(135deg, #0284c7, #f43f5e)"
              : `linear-gradient(135deg,${CYAN},${CORAL})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
            boxShadow: isLight ? "0 2px 6px rgba(2,132,199,0.3)" : "none",
          }}
        >
          ⚡
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: isLight ? "#0f172a" : "#fff" }}>
            IoT Hub
          </div>
          <div style={{ fontSize: 9, color: isLight ? "#0284c7" : CYAN, opacity: 0.85, fontWeight: 600 }}>
            Community v2.4
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: isLight ? "#e2e8f0" : GLASS_BDR, marginBottom: 10 }} />
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: isLight ? "#94a3b8" : "rgba(255,255,255,0.28)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          padding: "0 10px",
          marginBottom: 6,
        }}
      >
        Điều hướng
      </div>

      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === "/"}
          style={{ textDecoration: "none" }}
        >
          {({ isActive }) => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: isActive
                  ? isLight
                    ? "#e0f2fe"
                    : "rgba(0,229,255,0.10)"
                  : "transparent",
                borderLeft: isActive
                  ? `3px solid ${isLight ? "#0284c7" : CYAN}`
                  : "3px solid transparent",
                marginBottom: 2,
                transition: "all .15s",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: isActive
                    ? isLight
                      ? "#0284c7"
                      : CYAN
                    : isLight
                    ? "#64748b"
                    : "rgba(255,255,255,0.38)",
                  width: 16,
                  textAlign: "center",
                }}
              >
                {n.icon}
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? isLight
                      ? "#0284c7"
                      : CYAN
                    : isLight
                    ? "#475569"
                    : "rgba(220,240,245,0.55)",
                  whiteSpace: "nowrap",
                }}
              >
                {n.label}
              </span>
              {isActive && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: isLight ? "#0284c7" : CYAN,
                  }}
                />
              )}
            </div>
          )}
        </NavLink>
      ))}

      {/* status chip */}
      <div style={{ marginTop: "auto", padding: "10px 4px 0" }}>
        <div
          style={{
            background: isLight ? "#f0fdf4" : "rgba(0,229,255,0.06)",
            border: isLight ? "1px solid #bbf7d0" : `1px solid rgba(0,229,255,0.12)`,
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          <div style={{ fontSize: 10, color: isLight ? "#166534" : CYAN, fontWeight: 700 }}>
            Trạng thái hệ thống
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: GREEN,
                boxShadow: `0 0 5px ${GREEN}`,
                animation: "pulse-slow 2s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 10, color: isLight ? "#15803d" : "rgba(220,240,245,0.55)", fontWeight: 500 }}>
              Hoạt động bình thường
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── page layout: header + sidebar + vùng nội dung ───────────── */
export function PageLayout({
  title,
  contentStyle,
  children,
}: {
  title: string
  contentStyle?: React.CSSProperties
  children: React.ReactNode
}) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isLight ? '#f1f5f9' : '#060d14',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader title={title} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto', ...contentStyle }}>{children}</div>
      </div>
    </div>
  )
}

/* ── pagination footer cho bảng ──────────────────────────────── */
// Tối đa 7 ô: 1 … 4 5 6 … 20
function getPaginationRange(page: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (page >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', page - 1, page, page + 1, '...', total]
}

export function TablePagination({
  page,
  totalPages,
  total,
  limit,
  limitOptions,
  onPageChange,
  onLimitChange,
}: {
  page: number
  totalPages: number
  total: number
  limit: number
  limitOptions: number[]
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  const textMain = isLight ? '#0f172a' : '#f1f5f9'
  const textMuted = isLight ? '#64748b' : 'rgba(180,210,220,0.5)'

  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1
  const endEntry = Math.min(total, page * limit)

  const navBtn = (disabled: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: disabled ? (isLight ? '#cbd5e1' : 'rgba(255,255,255,0.18)') : isLight ? '#475569' : '#cbd5e1',
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter,sans-serif',
  })

  return (
    <div
      style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        borderTop: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: textMuted }}>
          Hiển thị <strong style={{ color: textMain }}>{startEntry}</strong> đến{' '}
          <strong style={{ color: textMain }}>{endEntry}</strong> trong tổng số{' '}
          <strong style={{ color: textMain }}>{total}</strong> bản ghi
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Số dòng / trang:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            style={{
              padding: '4px 24px 4px 10px',
              borderRadius: 16,
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.18)'}`,
              background: isLight ? '#ffffff' : '#0b1d2d',
              color: textMain,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'Inter,sans-serif',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {limitOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={navBtn(page <= 1)}>
          Trước
        </button>
        {getPaginationRange(page, totalPages).map((num, idx) =>
          num === '...' ? (
            <span key={`dots-${idx}`} style={{ padding: '4px 6px', color: textMuted, fontSize: 12 }}>
              ...
            </span>
          ) : (
            <button
              key={`page-${num}`}
              onClick={() => onPageChange(num)}
              style={{
                minWidth: 28,
                height: 28,
                padding: '0 6px',
                borderRadius: 6,
                border: 'none',
                background: page === num ? '#1890ff' : 'transparent',
                color: page === num ? '#ffffff' : isLight ? '#475569' : '#cbd5e1',
                fontSize: 12,
                fontWeight: page === num ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              {num}
            </button>
          )
        )}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={navBtn(page >= totalPages)}>
          Sau
        </button>
      </div>
    </div>
  )
}

/* ── table atoms ─────────────────────────────────────────────── */
export function THead({ cols }: { cols: string[] }) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  return (
    <thead>
      <tr
        style={{
          background: isLight ? "#f8fafc" : "rgba(0,229,255,0.055)",
          borderBottom: isLight ? "1px solid #e2e8f0" : `1px solid rgba(0,200,210,0.14)`,
        }}
      >
        {cols.map((c, i) => (
          <th
            key={i}
            style={{
              padding: "10px 12px",
              textAlign: "left",
              whiteSpace: "nowrap",
              fontSize: 10,
              fontWeight: 700,
              color: isLight ? "#475569" : "rgba(0,229,255,0.8)",
              letterSpacing: 0.7,
              textTransform: "uppercase",
            }}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export function TRow({
  children,
  odd,
}: {
  children: React.ReactNode
  odd: boolean
}) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  return (
    <tr
      style={{
        borderBottom: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255,255,255,0.035)",
        background: odd
          ? isLight
            ? "#f8fafc"
            : "rgba(0,229,255,0.025)"
          : "transparent",
        transition: "background .15s",
      }}
    >
      {children}
    </tr>
  )
}

export function TD({
  children,
  mono,
  accent,
}: {
  children: React.ReactNode
  mono?: boolean
  accent?: string
}) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  return (
    <td
      style={{
        padding: "9px 12px",
        fontSize: 11,
        whiteSpace: "nowrap",
        fontFamily: mono ? MONO : "inherit",
        color: accent ?? (isLight ? "#1e293b" : "rgba(220,240,245,0.65)"),
        fontWeight: mono ? 600 : 400,
      }}
    >
      {children}
    </td>
  )
}
