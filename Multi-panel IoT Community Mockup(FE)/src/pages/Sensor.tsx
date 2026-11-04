import { useState, useMemo } from 'react'
import { MONO, PageLayout, TablePagination } from '../components/shared'
import {
  getIndividualSensorReadings,
  exportIndividualReadingsCsv,
  IndividualReadingQueryParams,
  IndividualSensorReading,
} from '../services/mockApi'
import { useAppContext } from '../context/AppContext'

type TypeFilter = NonNullable<IndividualReadingQueryParams['type']>
type SortOption = NonNullable<IndividualReadingQueryParams['sort']>

type ColorPair = { bg: string; fg: string }

// Cùng bộ icon/màu với Dashboard (trang chủ)
const TYPE_META: Record<
  IndividualSensorReading['type'],
  { label: string; icon: string; light: ColorPair; dark: ColorPair }
> = {
  Temperature: {
    label: 'Temperature',
    icon: '🌡️',
    light: { bg: '#e0f2fe', fg: '#0284c7' },
    dark: { bg: 'rgba(2,132,199,0.18)', fg: '#00e5ff' },
  },
  Light: {
    label: 'Light',
    icon: '☀️',
    light: { bg: '#fef3c7', fg: '#d97706' },
    dark: { bg: 'rgba(217,119,6,0.18)', fg: '#fbbf24' },
  },
  Humidity: {
    label: 'Humidity',
    icon: '💧',
    light: { bg: '#ede9fe', fg: '#7c3aed' },
    dark: { bg: 'rgba(124,58,237,0.18)', fg: '#a78bfa' },
  },
}

const COLS = ['8%', '32%', '20%', '16%', '24%']

export default function Sensor() {
  const { theme } = useAppContext()
  const isLight = theme === 'light'

  // Giá trị đang nhập/chọn trên thanh công cụ (chưa áp dụng)
  const [searchInput, setSearchInput] = useState('')
  const [typeDraft, setTypeDraft] = useState<TypeFilter>('All Types')
  const [sortDraft, setSortDraft] = useState<SortOption>('Newest First')
  // Tham số đã áp dụng khi bấm Tìm kiếm / Enter
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

  function handleSearch() {
    setSearch(searchInput.trim())
    setTypeFilter(typeDraft)
    setSortOption(sortDraft)
    setPage(1)
  }

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(key)
    setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 1500)
  }

  function renderCopyButton(key: string, text: string, title: string) {
    const copied = copiedId === key
    return (
      <button
        onClick={() => handleCopy(key, text)}
        title={copied ? 'Đã sao chép!' : title}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          display: 'inline-flex',
          flexShrink: 0,
          color: copied ? '#16a34a' : isLight ? '#94a3b8' : 'rgba(180,210,220,0.4)',
        }}
      >
        {copied ? (
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
    )
  }

  function handleHeaderSort(col: 'no' | 'id' | 'name' | 'value' | 'timestamp') {
    setPage(1)
    const p = sortOption
    const next: SortOption =
      col === 'timestamp'
        ? p === 'Newest First' ? 'Oldest First' : 'Newest First'
        : col === 'no'
        ? p === 'No Asc' ? 'No Desc' : 'No Asc'
        : col === 'id'
        ? p === 'Id Asc' ? 'Id Desc' : 'Id Asc'
        : col === 'name'
        ? p === 'Name Asc' ? 'Name Desc' : 'Name Asc'
        : p === 'Value High to Low' ? 'Value Low to High' : 'Value High to Low'
    setSortOption(next)
    setSortDraft(next)
  }

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

  return (
    <PageLayout
      title="Dữ liệu cảm biến"
      contentStyle={{
        minWidth: 0,
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
              value={searchInput}
              placeholder={typeDraft === 'Time' ? 'VD: 14:58 hoặc 2026-10-27 14:5' : ''}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              style={{
                width: '100%',
                padding: '8px 96px 8px 38px',
                borderRadius: 22,
                border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(0,229,255,0.22)'}`,
                background: isLight ? '#ffffff' : '#091824',
                color: textMain,
                fontSize: 12,
                fontFamily: 'Inter,sans-serif',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              title="Tìm kiếm theo từ khóa, loại và sắp xếp đã chọn"
              style={{
                position: 'absolute',
                right: 4,
                padding: '5px 14px',
                borderRadius: 18,
                border: 'none',
                background: '#1890ff',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'Inter,sans-serif',
                cursor: 'pointer',
              }}
            >
              Tìm kiếm
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Loại:</span>
              <select
                value={typeDraft}
                onChange={(e) => setTypeDraft(e.target.value as TypeFilter)}
                style={selectStyle}
              >
                <option value="All Types">Tất cả loại</option>
                <option value="Temperature">🌡️ Nhiệt độ</option>
                <option value="Light">☀️ Ánh sáng</option>
                <option value="Humidity">💧 Độ ẩm</option>
                <option value="Time">🕒 Thời gian</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Sắp xếp:</span>
              <select
                value={sortDraft === 'Oldest First' ? 'Oldest First' : 'Newest First'}
                onChange={(e) => setSortDraft(e.target.value as SortOption)}
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
                marginLeft: 'auto',
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
                  const valueColors = isLight ? meta.light : meta.dark
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
                      <td style={{ ...tdStyle, fontSize: 12, fontFamily: MONO, color: isLight ? '#334155' : '#cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.id}</span>
                          {renderCopyButton(`id-${row.id}-${row.no}`, row.id, 'Sao chép ID')}
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
                            fontFamily: MONO,
                            background: valueColors.bg,
                            color: valueColors.fg,
                          }}
                        >
                          {row.formattedValue.replace('Lux', 'lx')}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, fontFamily: MONO, color: isLight ? '#475569' : '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.timestamp}</span>
                          {renderCopyButton(`time-${row.id}-${row.no}`, row.timestamp, 'Sao chép thời gian')}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={limit}
          limitOptions={[10, 20, 50, 100]}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n)
            setPage(1)
          }}
        />
      </div>
    </PageLayout>
  )
}
