import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ChartSeriesPoint, DeviceName, recordDeviceAction } from '../services/mockApi'

export type RangeOption = 'today' | 'week' | 'month'
export type SensorTypeOption = 'all' | 'temperature' | 'light' | 'humidity'

const LIVE_STEP_MS = 2000
const LIVE_POINTS = 16

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

function formatClock(d: Date) {
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':')
}

function createInitialLivePoints(): ChartSeriesPoint[] {
  const now = Date.now()
  return Array.from({ length: LIVE_POINTS }, (_, k) => {
    const i = LIVE_POINTS - 1 - k
    // Sóng dao động nhẹ quanh giá trị nền
    return {
      time: formatClock(new Date(now - i * LIVE_STEP_MS)),
      temperature: Number((29.2 + Math.sin(i * 0.45) * 1.5 + (Math.random() - 0.5) * 0.4).toFixed(1)),
      light: Math.round(850 + Math.sin(i * 0.4) * 45 + (Math.random() - 0.5) * 20),
      humidity: Math.round(63 - Math.sin(i * 0.45) * 3 + (Math.random() - 0.5) * 1.5),
    }
  })
}

// Bước ngẫu nhiên tiếp theo của luồng dữ liệu live, kẹp trong khoảng hợp lý
function nextLivePoint(prev: ChartSeriesPoint): ChartSeriesPoint {
  return {
    time: formatClock(new Date()),
    temperature: clamp(Number((prev.temperature + (Math.random() - 0.49) * 0.45).toFixed(1)), 26.5, 33.5),
    light: clamp(prev.light + Math.round((Math.random() - 0.49) * 32), 740, 970),
    humidity: clamp(prev.humidity + Math.round((Math.random() - 0.5) * 1.8), 56, 74),
  }
}

interface AppContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Trạng thái LED (true = BẬT)
  leds: Record<DeviceName, boolean>
  toggleLed: (name: DeviceName) => void

  // Bộ lọc Dashboard
  range: RangeOption
  setRange: (r: RangeOption) => void
  sensorType: SensorTypeOption
  setSensorType: (t: SensorTypeOption) => void

  // Luồng dữ liệu thời gian thực; điểm cuối là giá trị hiện tại
  isLive: boolean
  setIsLive: (v: boolean | ((prev: boolean) => boolean)) => void
  liveSeries: ChartSeriesPoint[]

  // Bộ lọc trang Lịch sử (giữ lại khi chuyển trang)
  historySearch: string
  setHistorySearch: (s: string) => void
  historyDevFilter: string
  setHistoryDevFilter: (d: string) => void
  historyActFilter: string
  setHistoryActFilter: (a: string) => void
  historyLimit: number
  setHistoryLimit: (l: number) => void
  historyPage: number
  setHistoryPage: (p: number) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))

  // index.css đổi màu nền/chữ theo thuộc tính data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const [leds, setLeds] = useState<Record<DeviceName, boolean>>({
    'LED 1': true,
    'LED 2': false,
    'LED 3': true,
  })
  const toggleLed = (name: DeviceName) => {
    const next = !leds[name]
    setLeds((prev) => ({ ...prev, [name]: next }))
    recordDeviceAction(name, next ? 'BẬT' : 'TẮT')
  }

  const [range, setRange] = useState<RangeOption>('today')
  const [sensorType, setSensorType] = useState<SensorTypeOption>('all')

  const [isLive, setIsLive] = useState(true)
  const [liveSeries, setLiveSeries] = useState<ChartSeriesPoint[]>(createInitialLivePoints)

  // Sinh điểm mới mỗi 2 giây khi đang LIVE
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      setLiveSeries((prev) => [...prev.slice(1), nextLivePoint(prev[prev.length - 1])])
    }, LIVE_STEP_MS)
    return () => clearInterval(interval)
  }, [isLive])

  const [historySearch, setHistorySearch] = useState('')
  const [historyDevFilter, setHistoryDevFilter] = useState('all')
  const [historyActFilter, setHistoryActFilter] = useState('all')
  const [historyLimit, setHistoryLimit] = useState(25)
  const [historyPage, setHistoryPage] = useState(1)

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        leds,
        toggleLed,
        range,
        setRange,
        sensorType,
        setSensorType,
        isLive,
        setIsLive,
        liveSeries,
        historySearch,
        setHistorySearch,
        historyDevFilter,
        setHistoryDevFilter,
        historyActFilter,
        setHistoryActFilter,
        historyLimit,
        setHistoryLimit,
        historyPage,
        setHistoryPage,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
