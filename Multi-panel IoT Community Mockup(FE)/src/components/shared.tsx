import { NavLink } from "react-router"
import { AreaChart, Area, YAxis, ResponsiveContainer } from "recharts"
import { useAppContext } from "../context/AppContext"

export const CYAN = "#00e5ff"
export const CORAL = "#ff6b6b"
export const YELLOW = "#ffd166"
export const VIOLET = "#b07aff"
export const GREEN = "#27c93f"
export const TEAL_HDR = "#0d3d3d"
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

/* ── sparkline ───────────────────────────────────────────────── */
export function Spark({
  data,
  color,
  domain,
}: {
  data: { v: number }[]
  color: string
  domain?: [number, number]
}) {
  const id = `g${color.replace(/[^a-z0-9]/gi, "")}`
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 5, right: 3, bottom: 2, left: 3 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor={color} stopOpacity={0.42} />
            <stop offset="95%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <YAxis domain={domain ?? [0, 'auto']} hide />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2.2}
          fill={`url(#${id})`}
          dot={(dotProps: any) => {
            if (dotProps.index === data.length - 1) {
              return (
                <circle
                  key={`dot-${dotProps.index}`}
                  cx={dotProps.cx}
                  cy={dotProps.cy}
                  r={3.5}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth={2.2}
                />
              )
            }
            return null
          }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── pagination ──────────────────────────────────────────────── */
export interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  limit?: number
  onPageChange: (newPage: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit = 25,
  onPageChange,
}: PaginationProps) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  if (totalItems === 0) return null

  // Generate page list with ellipsis
  const pages: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  const startRecord = (page - 1) * limit + 1
  const endRecord = Math.min(page * limit, totalItems)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        paddingTop: 6,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ fontSize: 11, color: isLight ? '#64748b' : 'rgba(180,210,220,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>
          Hiển thị <strong style={{ color: isLight ? '#0284c7' : CYAN }}>{startRecord} - {endRecord}</strong> / <strong style={{ color: isLight ? '#0f172a' : '#fff' }}>{totalItems}</strong> bản ghi
        </span>
        <span style={{ color: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)' }}>•</span>
        <span style={{ color: isLight ? '#64748b' : 'rgba(180,210,220,0.4)' }}>Trang {page} / {totalPages}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Previous */}
        <button
          onClick={() => page > 1 && onPageChange(page - 1)}
          disabled={page <= 1}
          title="Trang trước"
          style={{
            minWidth: 28,
            height: 28,
            borderRadius: 7,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            padding: '0 8px',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter,sans-serif',
            background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.09)',
            color: page <= 1 ? (isLight ? '#cbd5e1' : 'rgba(180,210,220,0.18)') : (isLight ? '#334155' : 'rgba(180,210,220,0.65)'),
            opacity: page <= 1 ? 0.5 : 1,
            transition: 'all .15s',
            boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          ‹ Trước
        </button>

        {pages.map((p, idx) => {
          if (p === '…') {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  width: 20,
                  textAlign: 'center',
                  fontSize: 11,
                  color: isLight ? '#94a3b8' : 'rgba(180,210,220,0.3)',
                }}
              >
                …
              </span>
            )
          }

          const pageNum = p as number
          const isActive = pageNum === page

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={{
                minWidth: 28,
                height: 28,
                borderRadius: 7,
                cursor: 'pointer',
                padding: '0 6px',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter,sans-serif',
                background: isActive
                  ? isLight
                    ? '#0284c7'
                    : 'rgba(0,229,255,0.18)'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? `1px solid ${isLight ? '#0284c7' : CYAN}`
                  : `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.09)'}`,
                color: isActive
                  ? '#ffffff'
                  : isLight
                  ? '#334155'
                  : 'rgba(180,210,220,0.5)',
                boxShadow: isActive ? (isLight ? '0 2px 6px rgba(2,132,199,0.3)' : '0 0 10px rgba(0,229,255,0.25)') : 'none',
                transition: 'all .15s',
              }}
            >
              {pageNum}
            </button>
          )
        })}

        {/* Next */}
        <button
          onClick={() => page < totalPages && onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Trang sau"
          style={{
            minWidth: 28,
            height: 28,
            borderRadius: 7,
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            padding: '0 8px',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter,sans-serif',
            background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.09)',
            color: page >= totalPages ? (isLight ? '#cbd5e1' : 'rgba(180,210,220,0.18)') : (isLight ? '#334155' : 'rgba(180,210,220,0.65)'),
            opacity: page >= totalPages ? 0.5 : 1,
            transition: 'all .15s',
            boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          Sau ›
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
        fontFamily: mono ? '"JetBrains Mono",monospace' : "inherit",
        color: accent ?? (isLight ? "#1e293b" : "rgba(220,240,245,0.65)"),
        fontWeight: mono ? 600 : 400,
      }}
    >
      {children}
    </td>
  )
}

export function StatusBadge({ st }: { st: string }) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  const warn = st === "Cảnh báo"
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: warn
          ? isLight
            ? "#ffe4e6"
            : "rgba(255,107,107,0.12)"
          : isLight
          ? "#dcfce7"
          : "rgba(39,201,63,0.10)",
        border: `1px solid ${
          warn
            ? isLight
              ? "#fecdd3"
              : "#ff6b6b44"
            : isLight
            ? "#bbf7d0"
            : "#27c93f44"
        }`,
        color: warn ? (isLight ? "#e11d48" : CORAL) : (isLight ? "#15803d" : GREEN),
      }}
    >
      {st}
    </span>
  )
}

export function SwitchBadge({ st }: { st: string }) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  const on = st === "BẬT"
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: on
          ? isLight
            ? "#dcfce7"
            : "rgba(39,201,63,0.10)"
          : isLight
          ? "#ffe4e6"
          : "rgba(255,107,107,0.10)",
        border: `1px solid ${
          on
            ? isLight
              ? "#bbf7d0"
              : "#27c93f55"
            : isLight
            ? "#fecdd3"
            : "#ff6b6b55"
        }`,
        borderRadius: 20,
        padding: "3px 10px 3px 6px",
      }}
    >
      <div
        style={{
          width: 22,
          height: 12,
          borderRadius: 6,
          background: on ? (isLight ? "#16a34a" : GREEN) : (isLight ? "#e11d48" : CORAL),
          display: "flex",
          alignItems: "center",
          padding: "0 2px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#fff",
            marginLeft: on ? "auto" : 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: on ? (isLight ? "#15803d" : GREEN) : (isLight ? "#e11d48" : CORAL),
        }}
      >
        {st}
      </span>
    </div>
  )
}
