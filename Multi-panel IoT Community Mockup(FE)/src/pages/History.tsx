import { useState, useMemo } from 'react'
import {
  CYAN,
  CORAL,
  GREEN,
  AppHeader,
  Sidebar,
  THead,
  TRow,
  TD,
} from '../components/shared'
import {
  getDeviceActions,
  exportDeviceActionsCsv,
} from '../services/mockApi'

import { useAppContext } from '../context/AppContext'

/* action log badge — static, shows what happened */
function ActionBadge({ action }: { action: 'BẬT' | 'TẮT' }) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  const on = action === 'BẬT'
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: isLight
          ? on
            ? '#dcfce7'
            : '#fee2e2'
          : on
          ? 'rgba(39,201,63,0.10)'
          : 'rgba(255,84,112,0.10)',
        border: `1px solid ${
          isLight
            ? on
              ? '#86efac'
              : '#fca5a5'
            : on
            ? '#27c93f44'
            : '#ff547044'
        }`,
        borderRadius: 6,
        padding: '4px 10px',
      }}
    >
      <span style={{ fontSize: 12 }}>{on ? '▶' : '■'}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: isLight ? (on ? '#15803d' : '#b91c1c') : on ? GREEN : CORAL,
          fontFamily: '"JetBrains Mono",monospace',
          letterSpacing: 0.5,
        }}
      >
        {on ? 'Đã bật' : 'Đã tắt'}
      </span>
    </div>
  )
}

/* Trạng thái thực thi: Thành công / Thất bại */
function StatusPill({ status }: { status: 'Thành công' | 'Thất bại' }) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  const ok = status === 'Thành công'
  const color = ok ? (isLight ? '#15803d' : GREEN) : isLight ? '#b91c1c' : CORAL
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 12px',
        borderRadius: 14,
        fontSize: 11,
        fontWeight: 700,
        color,
        background: ok
          ? isLight
            ? '#dcfce7'
            : 'rgba(39,201,63,0.12)'
          : isLight
          ? '#fee2e2'
          : 'rgba(255,84,112,0.12)',
        border: `1px solid ${ok ? (isLight ? '#86efac' : '#27c93f44') : isLight ? '#fca5a5' : '#ff547044'}`,
      }}
    >
      <span style={{ fontSize: 12 }}>{ok ? '✓' : '✕'}</span>
      {status}
    </span>
  )
}

export default function History() {
  const {
    theme,
    historySearch: search,
    setHistorySearch: setSearch,
    historyDevFilter: devFilter,
    setHistoryDevFilter: setDevFilter,
    historyActFilter: actFilter,
    setHistoryActFilter: setActFilter,
    historyLimit: limit,
    setHistoryLimit: setLimit,
    historyPage: page,
    setHistoryPage: setPage,
  } = useAppContext()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'Newest First' | 'Oldest First'>('Newest First')
  const isLight = theme === 'light'

  // Query paginated data
  const result = useMemo(() => {
    return getDeviceActions({
      page,
      limit,
      search,
      device_name: devFilter,
      action: actFilter,
      status: statusFilter,
      sort: sortOrder,
    })
  }, [page, limit, search, devFilter, actFilter, statusFilter, sortOrder, isRefreshing])

  // Get full matching dataset for CSV export
  const fullMatchingData = useMemo(() => {
    return getDeviceActions({
      page: 1,
      limit: 9999,
      search,
      device_name: devFilter,
      action: actFilter,
      status: statusFilter,
      sort: sortOrder,
    }).data
  }, [search, devFilter, actFilter, statusFilter, sortOrder, isRefreshing])

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

  function handleStatusFilterChange(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  // Filter change handlers (reset page to 1)
  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(1)
  }

  function handleDevFilterChange(val: string) {
    setDevFilter(val)
    setPage(1)
  }

  function handleActFilterChange(val: string) {
    setActFilter(val)
    setPage(1)
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit)
    setPage(1)
  }

  function handleRefresh() {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 250)
  }

  function handleExportCsv() {
    exportDeviceActionsCsv(fullMatchingData)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isLight ? '#f1f5f9' : '#060d14',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader title="Lịch sử hoạt động" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: isLight
              ? '#f8fafc'
              : 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(80,0,60,0.08) 0%, transparent 60%)',
          }}
        >
          {/* ── control bar ── */}
          <div
            style={{
              background: isLight ? '#ffffff' : 'rgba(8,18,28,0.7)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(0,200,210,0.10)'}`,
              borderRadius: 10,
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <input
              placeholder="🔍  Tìm kiếm lịch sử theo ID, người dùng, nguồn..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                flex: 1,
                minWidth: 160,
                background: isLight ? '#ffffff' : '#0c1f2e',
                border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(0,229,255,0.22)'}`,
                borderRadius: 7,
                padding: '6px 11px',
                fontSize: 11,
                color: isLight ? '#0f172a' : '#eef6f8',
                fontFamily: 'Inter,sans-serif',
                outline: 'none',
                boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : '0 2px 6px rgba(0,0,0,0.2)',
              }}
            />

            {/* Device Filter */}
            <select
              value={devFilter}
              onChange={(e) => handleDevFilterChange(e.target.value)}
              style={{
                padding: '6px 26px 6px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              <option value="all">Tất cả thiết bị</option>
              <option value="LED 1">LED 1</option>
              <option value="LED 2">LED 2</option>
              <option value="LED 3">LED 3</option>
            </select>

            {/* Action Filter */}
            <select
              value={actFilter}
              onChange={(e) => handleActFilterChange(e.target.value)}
              style={{
                padding: '6px 26px 6px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              <option value="all">Tất cả hành động</option>
              <option value="BẬT">BẬT</option>
              <option value="TẮT">TẮT</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              style={{
                padding: '6px 26px 6px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Thành công">Thành công</option>
              <option value="Thất bại">Thất bại</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'Newest First' | 'Oldest First')
                setPage(1)
              }}
              style={{
                padding: '6px 26px 6px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              <option value="Newest First">Mới nhất</option>
              <option value="Oldest First">Cũ nhất</option>
            </select>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              style={{
                background: isLight
                  ? isRefreshing
                    ? '#e0f2fe'
                    : '#f0fdf4'
                  : isRefreshing
                  ? 'rgba(0,229,255,0.2)'
                  : 'rgba(6,50,60,0.6)',
                border: `1px solid ${
                  isLight
                    ? '#86efac'
                    : 'rgba(0,229,255,0.28)'
                }`,
                borderRadius: 7,
                padding: '5px 12px',
                fontSize: 11,
                color: isLight ? '#15803d' : CYAN,
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 600,
                transition: 'all .15s',
              }}
            >
              <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}>
                ↻
              </span>
              Làm mới
            </button>

            {/* Export CSV button */}
            <button
              onClick={handleExportCsv}
              title={`Xuất ${result.total} bản ghi ra file CSV`}
              style={{
                background: isLight ? '#fef2f2' : 'rgba(255,107,107,0.12)',
                border: `1px solid ${isLight ? '#fca5a5' : '#ff6b6b55'}`,
                borderRadius: 7,
                padding: '5px 12px',
                fontSize: 11,
                color: isLight ? '#b91c1c' : CORAL,
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600,
                transition: 'all .15s',
              }}
            >
              <span>↓</span> Xuất CSV ({result.total})
            </button>
          </div>

          {/* ── table ── */}
          <div
            style={{
              background: isLight ? '#ffffff' : 'rgba(7,16,26,0.80)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(0,200,210,0.12)'}`,
              borderRadius: 12,
              overflow: 'hidden',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <THead
                  cols={[
                    'STT',
                    'ID',
                    'Thời gian',
                    'Thiết bị',
                    'Hành động',
                    'Trạng thái',
                    'Người thực hiện',
                  ]}
                />
                <tbody>
                  {result.data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: '36px',
                          textAlign: 'center',
                          color: isLight ? '#94a3b8' : 'rgba(220,240,245,0.35)',
                          fontSize: 13,
                        }}
                      >
                        Không có bản ghi phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    result.data.map((r, i) => (
                      <TRow key={r.id} odd={i % 2 === 1}>
                        <TD mono accent={isLight ? '#475569' : '#94a3b8'}>
                          {(result.page - 1) * result.limit + i + 1}
                        </TD>
                        <TD mono accent={isLight ? '#64748b' : 'rgba(180,210,220,0.38)'}>
                          {r.id}
                        </TD>
                        <TD mono accent={isLight ? '#334155' : 'rgba(220,240,245,0.65)'}>
                          {r.display_time}
                        </TD>
                        <TD>
                          <span
                            style={{
                              background: isLight ? '#e0f2fe' : 'rgba(0,229,255,0.09)',
                              border: `1px solid ${isLight ? '#bae6fd' : 'rgba(0,229,255,0.22)'}`,
                              borderRadius: 5,
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: isLight ? '#0369a1' : CYAN,
                            }}
                          >
                            {r.device_name}
                          </span>
                        </TD>
                        <TD>
                          <ActionBadge action={r.action} />
                        </TD>
                        <TD>
                          <StatusPill status={r.status} />
                        </TD>
                        <TD accent={isLight ? '#0f172a' : '#eef6f8'}>{r.performed_by}</TD>
                      </TRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Footer phân trang (giống trang Dữ liệu cảm biến) ── */}
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
                  <strong style={{ color: textMain }}>{result.total}</strong> bản ghi
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Số dòng / trang:</span>
                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
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
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {(() => {
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
                    <>
                      <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={navBtn(page <= 1)}>
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
                        style={navBtn(page >= result.totalPages)}
                      >
                        Sau
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
