import { useState, useMemo, useEffect } from 'react'
import { CYAN, CORAL, GREEN, MONO, PageLayout, TablePagination, THead, TRow, TD } from '../components/shared'
import {
  getDeviceActions,
  exportDeviceActionsCsv,
  subscribeDeviceActions,
  DEVICES,
  DeviceActionsQueryParams,
} from '../services/mockApi'
import { useAppContext } from '../context/AppContext'

type SortOrder = NonNullable<DeviceActionsQueryParams['sort']>

const filterSelectStyle: React.CSSProperties = {
  padding: '6px 26px 6px 10px',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'Inter,sans-serif',
}

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
          fontFamily: MONO,
          letterSpacing: 0.5,
        }}
      >
        {on ? 'Đã bật' : 'Đã tắt'}
      </span>
    </div>
  )
}

/* Trạng thái thực thi: Thành công / Thất bại / Đang xử lý */
function StatusPill({ status }: { status: 'Thành công' | 'Thất bại' | 'Đang xử lý' }) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  if (status === 'Đang xử lý') {
    const color = isLight ? '#b45309' : '#fbbf24'
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
          background: isLight ? '#fef3c7' : 'rgba(251,191,36,0.12)',
          border: `1px solid ${isLight ? '#fcd34d' : '#fbbf2444'}`,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        {status}
      </span>
    )
  }
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
  const isLight = theme === 'light'
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('Newest First')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)

  // Tải lại bảng khi có bản ghi mới hoặc trạng thái thay đổi
  useEffect(() => subscribeDeviceActions(() => setDataVersion((v) => v + 1)), [])

  const query: DeviceActionsQueryParams = {
    search,
    device_name: devFilter,
    action: actFilter,
    status: statusFilter,
    sort: sortOrder,
  }

  const result = useMemo(
    () => getDeviceActions({ ...query, page, limit }),
    [page, limit, search, devFilter, actFilter, statusFilter, sortOrder, isRefreshing, dataVersion]
  )

  // Đổi bộ lọc thì quay về trang 1
  const withPageReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v)
      setPage(1)
    }

  function handleRefresh() {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 250)
  }

  // Xuất toàn bộ bản ghi khớp bộ lọc, không chỉ trang hiện tại
  function handleExportCsv() {
    exportDeviceActionsCsv(getDeviceActions({ ...query, page: 1, limit: Math.max(1, result.total) }).data)
  }

  return (
    <PageLayout
      title="Lịch sử hoạt động"
      contentStyle={{
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
          onChange={(e) => withPageReset(setSearch)(e.target.value)}
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

        <select value={devFilter} onChange={(e) => withPageReset(setDevFilter)(e.target.value)} style={filterSelectStyle}>
          <option value="all">Tất cả thiết bị</option>
          {DEVICES.map((d) => (
            <option key={d.code} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        <select value={actFilter} onChange={(e) => withPageReset(setActFilter)(e.target.value)} style={filterSelectStyle}>
          <option value="all">Tất cả hành động</option>
          <option value="BẬT">BẬT</option>
          <option value="TẮT">TẮT</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => withPageReset(setStatusFilter)(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Thành công">Thành công</option>
          <option value="Thất bại">Thất bại</option>
          <option value="Đang xử lý">Đang xử lý</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => withPageReset(setSortOrder)(e.target.value as SortOrder)}
          style={filterSelectStyle}
        >
          <option value="Newest First">Mới nhất</option>
          <option value="Oldest First">Cũ nhất</option>
        </select>

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
            border: `1px solid ${isLight ? '#86efac' : 'rgba(0,229,255,0.28)'}`,
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
          <span
            style={{
              display: 'inline-block',
              transform: isRefreshing ? 'rotate(180deg)' : 'none',
              transition: 'transform .3s',
            }}
          >
            ↻
          </span>
          Làm mới
        </button>

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
            <THead cols={['STT', 'ID', 'Thời gian', 'Thiết bị', 'Hành động', 'Trạng thái', 'Người thực hiện']} />
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

        <TablePagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={limit}
          limitOptions={[10, 25, 50]}
          onPageChange={setPage}
          onLimitChange={withPageReset(setLimit)}
        />
      </div>
    </PageLayout>
  )
}
