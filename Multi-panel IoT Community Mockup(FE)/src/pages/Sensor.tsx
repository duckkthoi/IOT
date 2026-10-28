import { useState, useMemo } from 'react'
import { AppHeader, Sidebar } from '../components/shared'
import {
  getIndividualSensorReadings,
  exportIndividualReadingsCsv,
} from '../services/mockApi'
import { useAppContext } from '../context/AppContext'

type TypeFilter = 'All Types' | 'Temperature' | 'Humidity' | 'Light'
type SortOption =
  | 'Newest First'
  | 'Oldest First'
  | 'No Asc'
  | 'No Desc'
  | 'Id Asc'
  | 'Id Desc'
  | 'Name Asc'
  | 'Name Desc'
  | 'Value High to Low'
  | 'Value Low to High'

// Cùng bộ icon với Dashboard (trang chủ)
const TYPE_META: Record<'Temperature' | 'Humidity' | 'Light', { label: string; icon: string }> = {
  Temperature: { label: 'Temperature', icon: '🌡️' },
  Light: { label: 'Light', icon: '☀️' },
  Humidity: { label: 'Humidity', icon: '💧' },
}

const COLS = ['8%', '32%', '20%', '16%', '24%']

export default function Sensor() {
  const { theme } = useAppContext()
  const isLight = theme === 'light'

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All Types')
  const [sortOption, setSortOption] = useState<SortOption>('Newest First')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const result = useMemo(
    () => getIndividualSensorReadings({ page, limit, search, type: typeFilter, sort: sortOption }),
    [page, limit, search, typeFilter, sortOption]
  )

  function handleCopy(id: string) {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  function handleHeaderSort(col: 'no' | 'id' | 'name' | 'value' | 'timestamp') {
    setPage(1)
    if (col === 'timestamp') setSortOption((p) => (p === 'Newest First' ? 'Oldest First' : 'Newest First'))
    else if (col === 'no') setSortOption((p) => (p === 'No Asc' ? 'No Desc' : 'No Asc'))
    else if (col === 'id') setSortOption((p) => (p === 'Id Asc' ? 'Id Desc' : 'Id Asc'))
    else if (col === 'name') setSortOption((p) => (p === 'Name Asc' ? 'Name Desc' : 'Name Asc'))
    else setSortOption((p) => (p === 'Value High to Low' ? 'Value Low to High' : 'Value High to Low'))
  }

  const paginationRange = useMemo(() => {
    const total = result.totalPages
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (page >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '...', page - 1, page, page + 1, '...', total]
  }, [result.totalPages, page])

  const startEntry = result.total === 0 ? 0 : (result.page - 1) * result.limit + 1
  const endEntry = Math.min(result.total, result.page * result.limit)

  const textMain = isLight ? '#0f172a' : '#f1f5f9'
  const textMuted = isLight ? '#64748b' : 'rgba(180,210,220,0.5)'
  const border = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'

  const selectStyle: React.CSSProperties = {
    padding: '6px 28px 6px 14px',
    borderRadius: 20,
    border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.18)'}`,
    background: isLight ? '#ffffff' : '#0b1d2d',
    color: textMain,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'Inter,sans-serif',
    cursor: 'pointer',
    outline: 'none',
  }

  const thStyle: React.CSSProperties = {
    padding: '14px 18px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.8,
    cursor: 'pointer',
    userSelect: 'none',
    textTransform: 'uppercase',
  }

  const tdStyle: React.CSSProperties = { padding: '14px 18px' }

  const pageBtn = (disabled: boolean): React.CSSProperties => ({
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
        minHeight: '100vh',
        background: isLight ? '#f1f5f9' : '#060d14',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader title="Dữ liệu cảm biến" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            background: isLight
              ? '#f8fafc'
              : 'radial-gradient(ellipse 70% 50% at 80% 20%, rgba(0,60,100,0.12) 0%, transparent 60%)',
          }}
        >
          <div
            style={{
              background: isLight ? '#ffffff' : 'rgba(10,22,34,0.88)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(0,200,210,0.14)'}`,
              borderRadius: 14,
              boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.03)' : '0 8px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              width: '100%',
              flex: 1,
            }}
          >
            {/* Thanh công cụ */}
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                borderBottom: `1px solid ${border}`,
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 260, maxWidth: 440 }}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isLight ? '#94a3b8' : 'rgba(180,210,220,0.45)'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: 14, pointerEvents: 'none' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo tên, ID hoặc giá trị..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px 8px 38px',
                    borderRadius: 22,
                    border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(0,229,255,0.22)'}`,
                    background: isLight ? '#ffffff' : '#091824',
                    color: textMain,
                    fontSize: 12,
                    fontFamily: 'Inter,sans-serif',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Loại:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value as TypeFilter)
                      setPage(1)
                    }}
                    style={selectStyle}
                  >
                    <option value="All Types">Tất cả loại</option>
                    <option value="Temperature">🌡️ Nhiệt độ</option>
                    <option value="Light">☀️ Ánh sáng</option>
                    <option value="Humidity">💧 Độ ẩm</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Sắp xếp:</span>
                  <select
                    value={sortOption === 'Oldest First' ? 'Oldest First' : 'Newest First'}
                    onChange={(e) => {
                      setSortOption(e.target.value as SortOption)
                      setPage(1)
                    }}
                    style={selectStyle}
                  >
                    <option value="Newest First">Mới nhất</option>
                    <option value="Oldest First">Cũ nhất</option>
                  </select>
                </div>

                <button
                  onClick={() => exportIndividualReadingsCsv(result.data)}
                  title="Xuất dữ liệu ra file CSV"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1px solid ${isLight ? '#0ea5e9' : 'rgba(0,229,255,0.4)'}`,
                    background: isLight ? '#e0f2fe' : 'rgba(0,229,255,0.12)',
                    color: isLight ? '#0284c7' : '#00e5ff',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Inter,sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Xuất CSV
                </button>
              </div>
            </div>

            {/* Bảng dữ liệu */}
            <div style={{ overflowX: 'auto', width: '100%', flex: 1 }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left' }}>
                <colgroup>
                  {COLS.map((w, i) => (
                    <col key={i} style={{ width: w }} />
                  ))}
                </colgroup>
                <thead>
                  <tr style={{ background: '#1890ff', color: '#ffffff' }}>
                    <th onClick={() => handleHeaderSort('no')} style={{ ...thStyle, textAlign: 'center' }}>
                      STT
                    </th>
                    <th onClick={() => handleHeaderSort('id')} style={thStyle}>
                      ID <span style={{ opacity: 0.85 }}>⇅</span>
                    </th>
                    <th onClick={() => handleHeaderSort('name')} style={thStyle}>
                      Tên cảm biến <span style={{ opacity: 0.85 }}>⇅</span>
                    </th>
                    <th onClick={() => handleHeaderSort('value')} style={{ ...thStyle, textAlign: 'center' }}>
                      Giá trị <span style={{ opacity: 0.85 }}>⇅</span>
                    </th>
                    <th onClick={() => handleHeaderSort('timestamp')} style={thStyle}>
                      Thời gian{' '}
                      <span style={{ fontSize: 11, opacity: 0.9 }}>
                        {sortOption === 'Newest First' ? '▼' : sortOption === 'Oldest First' ? '▲' : '⇅'}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '42px 20px', textAlign: 'center', color: textMuted, fontSize: 13 }}>
                        Không tìm thấy bản ghi cảm biến phù hợp.
                      </td>
                    </tr>
                  ) : (
                    result.data.map((row) => {
                      const meta = TYPE_META[row.type]
                      const valueColors =
                        row.type === 'Temperature'
                          ? { bg: isLight ? '#e0f2fe' : 'rgba(2,132,199,0.18)', fg: isLight ? '#0284c7' : '#00e5ff' }
                          : row.type === 'Light'
                          ? { bg: isLight ? '#fef3c7' : 'rgba(217,119,6,0.18)', fg: isLight ? '#d97706' : '#fbbf24' }
                          : { bg: isLight ? '#ede9fe' : 'rgba(124,58,237,0.18)', fg: isLight ? '#7c3aed' : '#a78bfa' }
                      return (
                        <tr
                          key={row.id + row.no}
                          style={{ borderBottom: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)'}`, transition: 'background .15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tdStyle, textAlign: 'center', fontSize: 12, color: isLight ? '#475569' : '#94a3b8' }}>
                            {row.no}
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12, fontFamily: '"JetBrains Mono",monospace', color: isLight ? '#334155' : '#cbd5e1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.id}</span>
                              <button
                                onClick={() => handleCopy(row.id)}
                                title={copiedId === row.id ? 'Đã sao chép!' : 'Sao chép ID'}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 2,
                                  display: 'inline-flex',
                                  flexShrink: 0,
                                  color: copiedId === row.id ? '#16a34a' : isLight ? '#94a3b8' : 'rgba(180,210,220,0.4)',
                                }}
                              >
                                {copiedId === row.id ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <span style={{ fontSize: 16 }}>{meta.icon}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{meta.label}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 14px',
                                borderRadius: 14,
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: '"JetBrains Mono",monospace',
                                background: valueColors.bg,
                                color: valueColors.fg,
                              }}
                            >
                              {row.formattedValue.replace('Lux', 'lx')}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12, fontFamily: '"JetBrains Mono",monospace', color: isLight ? '#475569' : '#94a3b8' }}>
                            {row.timestamp}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                borderTop: `1px solid ${border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: textMuted }}>
                  Hiển thị <strong style={{ color: textMain }}>{startEntry}</strong> đến{' '}
                  <strong style={{ color: textMain }}>{endEntry}</strong> trong tổng số{' '}
                  <strong style={{ color: textMain }}>{result.total}</strong> bản ghi
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Số dòng / trang:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value))
                      setPage(1)
                    }}
                    style={{ ...selectStyle, padding: '4px 24px 4px 10px', borderRadius: 16 }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={pageBtn(page <= 1)}>
                  Trước
                </button>
                {paginationRange.map((num, idx) =>
                  num === '...' ? (
                    <span key={`dots-${idx}`} style={{ padding: '4px 6px', color: textMuted, fontSize: 12 }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${num}`}
                      onClick={() => setPage(Number(num))}
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
                <button
                  disabled={page >= result.totalPages}
                  onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                  style={pageBtn(page >= result.totalPages)}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
