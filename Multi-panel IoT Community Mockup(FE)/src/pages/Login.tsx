import { useState } from "react"
import { useNavigate } from "react-router"
import { CYAN, CORAL, YELLOW } from "../components/shared"
import { useAppContext } from "../context/AppContext"

export default function Login() {
  const navigate = useNavigate()
  const { theme } = useAppContext()
  const isLight = theme === "light"
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [show, setShow] = useState(false)
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !pass) {
      setErr("Vui lòng nhập đầy đủ thông tin.")
      return
    }
    setErr("")
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate("/")
    }, 900)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isLight
          ? "radial-gradient(ellipse 70% 60% at 50% 20%, #e0f2fe 0%, #f1f5f9 70%)"
          : `
        radial-gradient(ellipse 70% 60% at 15% 15%, rgba(0,80,100,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 85%, rgba(80,0,55,0.12) 0%, transparent 60%),
        #060d14
      `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* logo block */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${isLight ? "#0284c7" : CYAN}, ${CORAL})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              margin: "0 auto 14px",
              boxShadow: isLight ? "0 4px 16px rgba(2,132,199,0.25)" : `0 0 30px rgba(0,229,255,0.25)`,
            }}
          >
            ⚡
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: isLight ? "#0f172a" : "#eef6f8",
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            IoT Community
          </h1>
          <p
            style={{
              fontSize: 13,
              color: isLight ? "#64748b" : "rgba(220,240,245,0.45)",
              margin: "4px 0 0",
            }}
          >
            Đăng nhập vào hệ thống quản lý
          </p>
        </div>

        {/* card */}
        <div
          style={{
            background: isLight ? "#ffffff" : "rgba(11,24,36,0.82)",
            backdropFilter: "blur(28px)",
            border: `1px solid ${isLight ? "#e2e8f0" : "rgba(0,200,210,0.16)"}`,
            borderRadius: 16,
            padding: "28px 28px 24px",
            boxShadow: isLight
              ? "0 10px 30px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)"
              : "0 16px 60px rgba(0,0,0,0.5)",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* email */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isLight ? "#475569" : "rgba(220,240,245,0.55)",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: 0.4,
                }}
              >
                Email / Tên đăng nhập
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="minhduc@example.com"
                style={{
                  width: "100%",
                  background: isLight ? "#f8fafc" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    isLight
                      ? email
                        ? "#0284c7"
                        : "#cbd5e1"
                      : email
                      ? "rgba(0,229,255,0.35)"
                      : "rgba(255,255,255,0.10)"
                  }`,
                  borderRadius: 9,
                  padding: "10px 13px",
                  fontSize: 13,
                  color: isLight ? "#0f172a" : "#eef6f8",
                  fontFamily: "Inter,sans-serif",
                  outline: "none",
                  transition: "border-color .15s",
                }}
              />
            </div>

            {/* password */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isLight ? "#475569" : "rgba(220,240,245,0.55)",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: 0.4,
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    background: isLight ? "#f8fafc" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${
                      isLight
                        ? pass
                          ? "#0284c7"
                          : "#cbd5e1"
                        : pass
                        ? "rgba(0,229,255,0.35)"
                        : "rgba(255,255,255,0.10)"
                    }`,
                    borderRadius: 9,
                    padding: "10px 40px 10px 13px",
                    fontSize: 13,
                    color: isLight ? "#0f172a" : "#eef6f8",
                    fontFamily: "Inter,sans-serif",
                    outline: "none",
                    transition: "border-color .15s",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    color: isLight ? "#64748b" : "rgba(220,240,245,0.4)",
                    padding: 0,
                  }}
                >
                  {show ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* remember + forgot */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  style={{ accentColor: isLight ? "#0284c7" : CYAN, width: 14, height: 14 }}
                />
                <span style={{ fontSize: 12, color: isLight ? "#64748b" : "rgba(220,240,245,0.5)" }}>
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: isLight ? "#0284c7" : CYAN,
                  padding: 0,
                  textDecoration: "underline",
                  textDecorationColor: isLight ? "#0284c766" : "rgba(0,229,255,0.35)",
                  fontWeight: 600,
                }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* error */}
            {err && (
              <div
                style={{
                  background: isLight ? "#fee2e2" : "rgba(255,107,107,0.10)",
                  border: `1px solid ${isLight ? "#fca5a5" : "rgba(255,107,107,0.3)"}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: isLight ? "#b91c1c" : CORAL,
                  fontWeight: 500,
                }}
              >
                {err}
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                background: loading
                  ? isLight
                    ? "#e2e8f0"
                    : "rgba(0,229,255,0.15)"
                  : isLight
                  ? `linear-gradient(90deg, #0284c7, #0ea5e9)`
                  : `linear-gradient(90deg, rgba(0,180,190,0.85), rgba(0,229,255,0.75))`,
                border: isLight ? "none" : `1px solid ${CYAN}55`,
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 700,
                color: loading ? (isLight ? "#94a3b8" : CYAN) : "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Inter,sans-serif",
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: isLight ? "0 4px 12px rgba(2,132,199,0.3)" : "none",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: `2px solid ${isLight ? "#0284c7" : CYAN}`,
                      borderTopColor: "transparent",
                      display: "inline-block",
                      animation: "spin .7s linear infinite",
                    }}
                  />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "18px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: isLight ? "#e2e8f0" : "rgba(255,255,255,0.08)",
              }}
            />
            <span style={{ fontSize: 11, color: isLight ? "#94a3b8" : "rgba(220,240,245,0.3)" }}>
              hoặc
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: isLight ? "#e2e8f0" : "rgba(255,255,255,0.08)",
              }}
            />
          </div>

          {/* OAuth buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "🌐", label: "Google" },
              { icon: "🐙", label: "GitHub" },
            ].map((b) => (
              <button
                key={b.label}
                style={{
                  flex: 1,
                  padding: "9px",
                  background: isLight ? "#f8fafc" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isLight ? "#e2e8f0" : "rgba(255,255,255,0.09)"}`,
                  borderRadius: 9,
                  fontSize: 12,
                  color: isLight ? "#334155" : "rgba(220,240,245,0.65)",
                  cursor: "pointer",
                  fontFamily: "Inter,sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontWeight: 600,
                  transition: "border-color .15s",
                }}
              >
                <span>{b.icon}</span> {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* register link */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: isLight ? "#64748b" : "rgba(220,240,245,0.38)",
            marginTop: 16,
          }}
        >
          Chưa có tài khoản?{" "}
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: isLight ? "#0284c7" : CYAN,
              fontWeight: 600,
              padding: 0,
              fontFamily: "Inter,sans-serif",
            }}
          >
            Đăng ký ngay
          </button>
        </p>

        {/* bottom tags */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginTop: 20,
          }}
        >
          {[
            ["IoT Hub", CYAN],
            ["v2.4.1", YELLOW],
            ["Bảo mật SSL", "#27c93f"],
          ].map(([l, c]) => (
            <span
              key={l}
              style={{
                fontSize: 10,
                color: c as string,
                opacity: 0.65,
                background: `${c}11`,
                border: `1px solid ${c}22`,
                borderRadius: 4,
                padding: "2px 7px",
              }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
