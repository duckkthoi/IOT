import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  CYAN,
  CORAL,
  YELLOW,
  VIOLET,
  GREEN,
  GLASS,
  GLASS_BDR,
  AppHeader,
  Sidebar,
} from '../components/shared'
import { getSensorHistory, ChartSeriesPoint } from '../services/mockApi'
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
            fontFamily: '"JetBrains Mono",monospace',
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
  id,
  title,
  icon,
  dataKey,
  unit,
  currentValue,
  color,
  data,
  isLive,
  domain,
  tickFormatter,
  stats,
}: {
  id: string
  title: string
  icon: string
  dataKey: 'temperature' | 'light' | 'humidity'
  unit: string
  currentValue: string
  color: string
  data: ChartSeriesPoint[]
  isLive?: boolean
  domain: [(min: number) => number, (max: number) => number] | [number, number]
  tickFormatter: (v: number) => string
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
              fontFamily: '"JetBrains Mono",monospace',
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
              key={`chart-${id}-${theme}`}
              data={data}
              margin={{ top: 8, right: 10, bottom: 0, left: -14 }}
            >
              <defs>
                <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={tickFormatter}
                tick={{
                  fill: color,
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: '"JetBrains Mono",monospace',
                }}
                axisLine={false}
                tickLine={false}
                width={42}
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
                fill={`url(#grad-${id})`}
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
              Min: <strong style={{ color: isLight ? '#0f172a' : '#fff' }}>{stats.min}</strong>
            </span>
            <span>
              Max: <strong style={{ color: isLight ? '#0f172a' : '#fff' }}>{stats.max}</strong>
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
  trackColor,
}: {
  label: string
  code: string
  isOn: boolean
  onToggle: () => void
  trackColor: string
}) {
  const { theme } = useAppContext()
  const isLight = theme === 'light'
  const activeColor = isLight
    ? trackColor === YELLOW
      ? '#d97706'
      : trackColor === CYAN
      ? '#0284c7'
      : '#e11d48'
    : trackColor

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
            ? '#f0fdfa'
            : '#ffffff'
          : isOn
          ? 'rgba(10,26,38,0.85)'
          : 'rgba(8,18,28,0.65)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${
          isLight
            ? isOn
              ? activeColor + '44'
              : '#e2e8f0'
            : isOn
            ? trackColor + '55'
            : 'rgba(255,255,255,0.08)'
        }`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all .2s ease',
        boxShadow:
          isLight && isOn
            ? `0 2px 10px ${activeColor}20`
            : !isLight && isOn
            ? `0 0 16px ${trackColor}22`
            : 'none',
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
              fontFamily: '"JetBrains Mono",monospace',
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

const RANGE_LABELS: Record<RangeOption, string> = {
  today: 'Thời gian thực (Hôm nay)',
  week: 'Tuần',
  month: 'Tháng',
}

export default function Home() {
  const {
    theme,
    l1,
    toggleL1,
    l2,
    toggleL2,
    l3,
    toggleL3,
    range,
    setRange,
    sensorType,
    setSensorType,
    isLive,
    setIsLive,
    liveSeries,
    currentTemp,
    currentLight,
    currentHumid,
  } = useAppContext()

  const isLight = theme === 'light'

  // Dynamic palette based on theme
  const chartTempColor = isLight ? '#0284c7' : CYAN
  const chartLightColor = isLight ? '#d97706' : YELLOW
  const chartHumidColor = isLight ? '#7c3aed' : VIOLET

  // Get active chart series: if range is today, show real-time streaming; otherwise show week/month
  const chartSeries = useMemo(() => {
    if (range === 'today') {
      return liveSeries
    }
    return getSensorHistory(range, sensorType).series
  }, [range, sensorType, liveSeries])

  // Calculate summary metrics for the current view
  const stats = useMemo(() => {
    if (!chartSeries.length) return null

    const temps = chartSeries.map((d) => d.temperature)
    const lights = chartSeries.map((d) => d.light)
    const humids = chartSeries.map((d) => d.humidity)

    const avg = (arr: number[]) =>
      (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)

    return {
      tempAvg: avg(temps),
      tempMin: Math.min(...temps),
      tempMax: Math.max(...temps),
      lightAvg: Math.round(Number(avg(lights))),
      lightMin: Math.min(...lights),
      lightMax: Math.max(...lights),
      humidAvg: Math.round(Number(avg(humids))),
      humidMin: Math.min(...humids),
      humidMax: Math.max(...humids),
    }
  }, [chartSeries])

  const showTemp = sensorType === 'all' || sensorType === 'temperature'
  const showLight = sensorType === 'all' || sensorType === 'light'
  const showHumid = sensorType === 'all' || sensorType === 'humidity'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isLight ? '#f1f5f9' : '#060d14',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader title="Trang chủ" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div
          style={{
            flex: 1,
            overflow: 'auto',
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              <LedSwitchCard
                label="LED 1"
                code="LED-01"
                isOn={l1}
                onToggle={toggleL1}
                trackColor={CORAL}
              />
              <LedSwitchCard
                label="LED 2"
                code="LED-02"
                isOn={l2}
                onToggle={toggleL2}
                trackColor={CYAN}
              />
              <LedSwitchCard
                label="LED 3"
                code="LED-03"
                isOn={l3}
                onToggle={toggleL3}
                trackColor={YELLOW}
              />
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
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isLight ? '#0f172a' : '#eef6f8',
                }}
              >
                Biểu đồ cảm biến độc lập
              </span>

              {/* Nút bật/tắt LIVE */}
              <button
                onClick={() => setIsLive((v) => !v)}
                title={isLive ? 'Bấm để tạm dừng cập nhật' : 'Bấm để tiếp tục'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'Inter,sans-serif',
                  background: isLight
                    ? isLive
                      ? '#dcfce7'
                      : '#f1f5f9'
                    : isLive
                    ? 'rgba(39,201,63,0.14)'
                    : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${
                    isLight
                      ? isLive
                        ? '#86efac'
                        : '#e2e8f0'
                      : isLive
                      ? '#27c93f77'
                      : 'rgba(255,255,255,0.15)'
                  }`,
                  color: isLight
                    ? isLive
                      ? '#15803d'
                      : '#64748b'
                    : isLive
                    ? GREEN
                    : 'rgba(180,210,220,0.5)',
                  transition: 'all .15s',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isLive ? (isLight ? '#16a34a' : GREEN) : isLight ? '#94a3b8' : 'rgba(180,210,220,0.3)',
                    boxShadow: isLive ? `0 0 6px ${isLight ? '#16a34a' : GREEN}` : 'none',
                    animation: isLive ? 'pulse-slow 1.5s ease-in-out infinite' : 'none',
                  }}
                />
                {isLive ? 'LIVE (2s)' : 'TẠM DỪNG'}
              </button>

              {/* Chọn mốc thời gian */}
              <div style={{ display: 'flex', gap: 5 }}>
                {(['today', 'week', 'month'] as RangeOption[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 5,
                      fontSize: 10,
                      cursor: 'pointer',
                      fontFamily: 'Inter,sans-serif',
                      background:
                        r === range
                          ? isLight
                            ? '#e0f2fe'
                            : 'rgba(0,229,255,0.14)'
                          : isLight
                          ? '#f8fafc'
                          : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${
                        r === range
                          ? isLight
                            ? '#0284c7'
                            : CYAN
                          : isLight
                          ? '#e2e8f0'
                          : 'rgba(255,255,255,0.09)'
                      }`,
                      color:
                        r === range
                          ? isLight
                            ? '#0284c7'
                            : CYAN
                          : isLight
                          ? '#64748b'
                          : 'rgba(180,210,220,0.38)',
                      fontWeight: r === range ? 700 : 500,
                      transition: 'all .12s',
                    }}
                  >
                    {r === 'today' ? 'Thời gian thực' : RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bộ chọn lọc cảm biến */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {(
                [
                  { key: 'all', label: 'Tất cả (3 biểu đồ)' },
                  { key: 'temperature', label: 'Nhiệt độ' },
                  { key: 'light', label: 'Ánh sáng' },
                  { key: 'humidity', label: 'Độ ẩm' },
                ] as { key: SensorTypeOption; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSensorType(tab.key)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    fontSize: 10,
                    cursor: 'pointer',
                    fontFamily: 'Inter,sans-serif',
                    background:
                      sensorType === tab.key
                        ? isLight
                          ? '#e2e8f0'
                          : 'rgba(255,255,255,0.12)'
                        : 'transparent',
                    border: 'none',
                    color:
                      sensorType === tab.key
                        ? isLight
                          ? '#0f172a'
                          : '#ffffff'
                        : isLight
                        ? '#64748b'
                        : 'rgba(180,210,220,0.45)',
                    fontWeight: sensorType === tab.key ? 700 : 500,
                    transition: 'all .15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 3 Biểu đồ cảm biến riêng biệt ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                sensorType === 'all'
                  ? 'repeat(auto-fit, minmax(340px, 1fr))'
                  : '1fr',
              gap: 12,
            }}
          >
            {showTemp && (
              <SingleSensorChartCard
                id="temperature"
                title="Cảm biến Nhiệt độ"
                icon="🌡️"
                dataKey="temperature"
                unit="°C"
                currentValue={currentTemp.toFixed(1)}
                color={chartTempColor}
                data={chartSeries}
                isLive={isLive}
                domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
                tickFormatter={(v) => `${v}°C`}
                stats={
                  stats
                    ? {
                        avg: stats.tempAvg,
                        min: stats.tempMin,
                        max: stats.tempMax,
                      }
                    : null
                }
              />
            )}

            {showLight && (
              <SingleSensorChartCard
                id="light"
                title="Cảm biến Ánh sáng"
                icon="☀️"
                dataKey="light"
                unit="lx"
                currentValue={String(currentLight)}
                color={chartLightColor}
                data={chartSeries}
                isLive={isLive}
                domain={[(min: number) => Math.max(0, Math.floor(min - 35)), (max: number) => Math.ceil(max + 35)]}
                tickFormatter={(v) => `${v} lx`}
                stats={
                  stats
                    ? {
                        avg: stats.lightAvg,
                        min: stats.lightMin,
                        max: stats.lightMax,
                      }
                    : null
                }
              />
            )}

            {showHumid && (
              <SingleSensorChartCard
                id="humidity"
                title="Cảm biến Độ ẩm"
                icon="💧"
                dataKey="humidity"
                unit="%"
                currentValue={String(currentHumid)}
                color={chartHumidColor}
                data={chartSeries}
                isLive={isLive}
                domain={[(min: number) => Math.max(0, Math.floor(min - 3)), (max: number) => Math.min(100, Math.ceil(max + 3))]}
                tickFormatter={(v) => `${v}%`}
                stats={
                  stats
                    ? {
                        avg: stats.humidAvg,
                        min: stats.humidMin,
                        max: stats.humidMax,
                      }
                    : null
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
