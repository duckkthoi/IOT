import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CYAN, YELLOW, VIOLET, GREEN, GLASS, GLASS_BDR, MONO, PageLayout } from '../components/shared'
import { getSensorHistory, ChartSeriesPoint, DEVICES } from '../services/mockApi'
import { useAppContext, RangeOption, SensorTypeOption } from '../context/AppContext'

interface SingleSensorTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    name: string
    value: number
    color: string
  }>
  label?: string
  unit: string
  color: string
  title: string
}

function SingleSensorTooltip({
  active,
  payload,
  label,
  unit,
  color,
  title,
}: SingleSensorTooltipProps) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  if (!active || !payload || !payload.length) return null

  return (
    <div
      style={{
        background: isLight ? '#ffffff' : '#0b1e2c',
        border: `1px solid ${isLight ? '#e2e8f0' : GLASS_BDR}`,
        borderRadius: 8,
        padding: '6px 10px',
        boxShadow: isLight
          ? '0 6px 20px rgba(0,0,0,0.08)'
          : '0 8px 24px rgba(0,0,0,0.6)',
        fontSize: 11,
      }}
    >
      <div
        style={{
          color: isLight ? '#64748b' : 'rgba(180,210,220,0.7)',
          fontWeight: 600,
          marginBottom: 3,
          fontSize: 10,
        }}
      >
        Thời gian: {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
        <span style={{ color: isLight ? '#334155' : 'rgba(220,240,245,0.75)' }}>
          {title}:
        </span>
        <span
          style={{
            color: color,
            fontWeight: 700,
            fontFamily: MONO,
            marginLeft: 'auto',
          }}
        >
          {payload[0].value} {unit}
        </span>
      </div>
    </div>
  )
}

function SingleSensorChartCard({
  title,
  icon,
  dataKey,
  unit,
  currentValue,
  color,
  data,
  isLive,
  domain,
  stats,
}: {
  title: string
  icon: string
  dataKey: 'temperature' | 'light' | 'humidity'
  unit: string
  currentValue: string
  color: string
  data: ChartSeriesPoint[]
  isLive?: boolean
  domain: [(min: number) => number, (max: number) => number] | [number, number]
  stats?: { avg: string | number; min: number; max: number } | null
}) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'

  return (
    <div
      style={{
        background: isLight ? '#ffffff' : 'rgba(12,28,42,0.72)',
        backdropFilter: 'blur(18px)',
        border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(0,200,210,0.14)'}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : 'none',
        minHeight: 290,
      }}
    >
      {/* Card Header: Icon, Name, LIVE indicator, and Current Value Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isLight ? '#1e293b' : '#f1f5f9',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isLive ? '#27c93f' : '#94a3b8',
                  boxShadow: isLive ? '0 0 6px #27c93f' : 'none',
                  animation: isLive ? 'pulse-slow 2s ease-in-out infinite' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: isLive
                    ? isLight
                      ? '#16a34a'
                      : GREEN
                    : isLight
                    ? '#94a3b8'
                    : 'rgba(180,210,220,0.4)',
                }}
              >
                {isLive ? 'LIVE' : 'TẠM DỪNG'}
              </span>
            </div>
          </div>
        </div>

        {/* Current reading badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
            background: `${color}14`,
            border: `1px solid ${color}33`,
            padding: '3px 10px',
            borderRadius: 8,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: color,
              fontFamily: MONO,
              letterSpacing: -0.3,
            }}
          >
            {currentValue}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: color,
            }}
          >
            {unit}
          </span>
        </div>
      </div>

      {/* Area / Line Chart */}
      <div style={{ flex: 1, minHeight: 185, width: '100%' }}>
        {data.length > 0 && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color,
              fontFamily: MONO,
              marginBottom: 2,
              paddingLeft: 4,
            }}
          >
            ({unit})
          </div>
        )}
        {data.length === 0 ? (
          <div
            style={{
              height: 185,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLight ? '#94a3b8' : 'rgba(220,240,245,0.35)',
              fontSize: 11,
            }}
          >
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart
              key={`chart-${dataKey}-${theme}`}
              data={data}
              margin={{ top: 8, right: 10, bottom: 0, left: -14 }}
            >
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={isLight ? '#f1f5f9' : 'rgba(0,229,255,0.06)'}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="time"
                tick={{ fill: isLight ? '#64748b' : 'rgba(180,210,220,0.45)', fontSize: 9 }}
                axisLine={{ stroke: isLight ? '#e2e8f0' : 'rgba(0,229,255,0.12)' }}
                tickLine={false}
              />
              <YAxis
                domain={domain}
                allowDecimals={false}
                tick={{
                  fill: color,
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: MONO,
                }}
                axisLine={false}
                tickLine={false}
                width={dataKey === 'light' ? 44 : 38}
              />
              <Tooltip
                content={
                  <SingleSensorTooltip
                    unit={unit}
                    color={color}
                    title={title}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2.4}
                fill={`url(#grad-${dataKey})`}
                dot={{ r: 2.2, fill: color }}
                activeDot={{ r: 5, fill: '#fff', stroke: color, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer statistics */}
      {stats && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10,
            marginTop: 8,
            paddingTop: 8,
            borderTop: isLight ? '1px dashed #e2e8f0' : '1px dashed rgba(255,255,255,0.08)',
            color: isLight ? '#64748b' : 'rgba(180,210,220,0.6)',
          }}
        >
          <div>
            <span>Trung bình: </span>
            <strong style={{ color: isLight ? '#0f172a' : '#fff' }}>
              {stats.avg} {unit}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span>
              Min: <strong style={{ color: isLight ? '#0f172a' : '#fff' }}>{stats.min} {unit}</strong>
            </span>
            <span>
              Max: <strong style={{ color: isLight ? '#0f172a' : '#fff' }}>{stats.max} {unit}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function LedSwitchCard({
  label,
  code,
  isOn,
  onToggle,
  color,
}: {
  label: string
  code: string
  isOn: boolean
  onToggle: () => void
  color: { light: string; dark: string }
}) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  const activeColor = isLight ? color.light : color.dark

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      style={{
        background: isLight
          ? isOn
            ? activeColor + '10'
            : '#ffffff'
          : isOn
          ? 'rgba(10,26,38,0.85)'
          : 'rgba(8,18,28,0.65)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${
          isOn ? activeColor + (isLight ? '44' : '55') : isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'
        }`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all .2s ease',
        boxShadow: isOn ? (isLight ? `0 2px 10px ${activeColor}20` : `0 0 16px ${activeColor}22`) : 'none',
      }}
    >
      {/* Left: Device identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Glow status dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isOn
              ? activeColor
              : isLight
              ? '#cbd5e1'
              : 'rgba(255,255,255,0.2)',
            boxShadow: isOn ? `0 0 8px ${activeColor}` : 'none',
            transition: 'all .25s ease',
          }}
        />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isLight
                ? isOn
                  ? '#0f172a'
                  : '#64748b'
                : isOn
                ? '#eef6f8'
                : 'rgba(180,210,220,0.5)',
              fontFamily: 'Inter,sans-serif',
              letterSpacing: -0.2,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: MONO,
              color: isLight ? '#94a3b8' : 'rgba(180,210,220,0.3)',
              marginTop: 1,
            }}
          >
            {code}
          </div>
        </div>
      </div>

      {/* Right: iOS-like Toggle Track */}
      <div
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: isOn
            ? activeColor
            : isLight
            ? '#e2e8f0'
            : 'rgba(255,255,255,0.14)',
          position: 'relative',
          transition: 'background .25s ease',
          boxShadow: isOn ? `0 0 10px ${activeColor}55` : 'none',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#ffffff',
            position: 'absolute',
            top: 3,
            left: isOn ? 23 : 3,
            transition: 'left .2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  )
}

// Mỗi đèn một màu riêng (đỏ, vàng, xanh dương)
const LED_COLORS: { light: string; dark: string }[] = [
  { light: '#dc2626', dark: '#ff5c5c' },
  { light: '#d97706', dark: '#ffc93c' },
  { light: '#2563eb', dark: '#4da3ff' },
]

const RANGE_LABELS: Record<RangeOption, string> = {
  today: 'Thời gian thực',
  week: 'Tuần',
  month: 'Tháng',
}

const SENSOR_TABS: { key: SensorTypeOption; label: string }[] = [
  { key: 'all', label: 'Tất cả (3 biểu đồ)' },
  { key: 'temperature', label: 'Nhiệt độ' },
  { key: 'light', label: 'Ánh sáng' },
  { key: 'humidity', label: 'Độ ẩm' },
]

type SensorKey = Exclude<SensorTypeOption, 'all'>

const SENSOR_CHARTS: {
  key: SensorKey
  title: string
  icon: string
  unit: string
  lightColor: string
  darkColor: string
  decimals: number
  domain: [(min: number) => number, (max: number) => number]
}[] = [
  {
    key: 'temperature',
    title: 'Cảm biến Nhiệt độ',
    icon: '🌡️',
    unit: '°C',
    lightColor: '#0284c7',
    darkColor: CYAN,
    decimals: 1,
    domain: [(min) => Math.floor(min - 1), (max) => Math.ceil(max + 1)],
  },
  {
    key: 'light',
    title: 'Cảm biến Ánh sáng',
    icon: '☀️',
    unit: 'Lux',
    lightColor: '#d97706',
    darkColor: YELLOW,
    decimals: 0,
    domain: [(min) => Math.max(0, Math.floor((min - 20) / 50) * 50), (max) => Math.ceil((max + 20) / 50) * 50],
  },
  {
    key: 'humidity',
    title: 'Cảm biến Độ ẩm',
    icon: '💧',
    unit: '%',
    lightColor: '#7c3aed',
    darkColor: VIOLET,
    decimals: 0,
    domain: [(min) => Math.max(0, Math.floor(min - 3)), (max) => Math.min(100, Math.ceil(max + 3))],
  },
]

function summarize(values: number[], decimals: number) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return {
    avg: decimals ? avg.toFixed(decimals) : Math.round(avg),
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

export default function Home() {
  const { theme, leds, toggleLed, range, setRange, sensorType, setSensorType, isLive, setIsLive, liveSeries } =
    useAppContext()
  const isLight = theme === 'light'
  const latest = liveSeries[liveSeries.length - 1]

  // "Thời gian thực" vẽ luồng live; tuần/tháng lấy dữ liệu lịch sử
  const chartSeries = useMemo(
    () => (range === 'today' ? liveSeries : getSensorHistory(range, sensorType).series),
    [range, sensorType, liveSeries]
  )

  const visibleCharts = SENSOR_CHARTS.filter((c) => sensorType === 'all' || sensorType === c.key)

  return (
    <PageLayout
      title="Trang chủ"
      contentStyle={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: isLight
          ? '#f8fafc'
          : 'radial-gradient(ellipse 70% 50% at 10% 0%, rgba(0,80,100,0.12) 0%, transparent 60%)',
      }}
    >
      {/* ── Điều khiển công tắc LED ── */}
      <div
        style={{
          background: isLight ? '#ffffff' : GLASS,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isLight ? '#e2e8f0' : GLASS_BDR}`,
          borderRadius: 12,
          padding: '12px 14px',
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: isLight ? '#64748b' : 'rgba(180,210,220,0.38)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Điều khiển công tắc LED
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {DEVICES.map((d, i) => (
            <LedSwitchCard
              key={d.code}
              label={d.name}
              code={d.code}
              isOn={leds[d.name]}
              onToggle={() => toggleLed(d.name)}
              color={LED_COLORS[i % LED_COLORS.length]}
            />
          ))}
        </div>
      </div>

      {/* ── Toolbar điều khiển biểu đồ cảm biến ── */}
      <div
        style={{
          background: isLight ? '#ffffff' : GLASS,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isLight ? '#e2e8f0' : GLASS_BDR}`,
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isLight ? '#0f172a' : '#eef6f8' }}>
            Biểu đồ cảm biến độc lập
          </span>
        </div>

        {/* Bộ chọn lọc cảm biến */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {SENSOR_TABS.map((tab) => {
            const active = sensorType === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setSensorType(tab.key)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 5,
                  fontSize: 10,
                  cursor: 'pointer',
                  fontFamily: 'Inter,sans-serif',
                  background: active ? (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.12)') : 'transparent',
                  border: 'none',
                  color: active ? (isLight ? '#0f172a' : '#ffffff') : isLight ? '#64748b' : 'rgba(180,210,220,0.45)',
                  fontWeight: active ? 700 : 500,
                  transition: 'all .15s',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Biểu đồ cảm biến riêng biệt ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: sensorType === 'all' ? 'repeat(auto-fit, minmax(340px, 1fr))' : '1fr',
          gap: 12,
        }}
      >
        {visibleCharts.map((c) => (
          <SingleSensorChartCard
            key={c.key}
            title={c.title}
            icon={c.icon}
            dataKey={c.key}
            unit={c.unit}
            currentValue={latest[c.key].toFixed(c.decimals)}
            color={isLight ? c.lightColor : c.darkColor}
            data={chartSeries}
            isLive={isLive}
            domain={c.domain}
            stats={chartSeries.length ? summarize(chartSeries.map((p) => p[c.key]), c.decimals) : null}
          />
        ))}
      </div>
    </PageLayout>
  )
}
