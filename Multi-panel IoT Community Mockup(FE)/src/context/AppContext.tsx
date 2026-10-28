import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { ChartSeriesPoint, recordDeviceAction } from '../services/mockApi'

export type RangeOption = 'today' | 'week' | 'month'
export type SensorTypeOption = 'all' | 'temperature' | 'light' | 'humidity'

function createInitialLivePoints(): ChartSeriesPoint[] {
  const points: ChartSeriesPoint[] = []
  const now = Date.now()
  const stepMs = 2000 // 2 seconds per step
  for (let i = 15; i >= 0; i--) {
    const t = new Date(now - i * stepMs)
    const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`

    // Smooth undulating wave around current baseline
    const temp = Number((29.2 + Math.sin(i * 0.45) * 1.5 + (Math.random() - 0.5) * 0.4).toFixed(1))
    const light = Math.round(850 + Math.sin(i * 0.4) * 45 + (Math.random() - 0.5) * 20)
    const humid = Math.round(63 - Math.sin(i * 0.45) * 3 + (Math.random() - 0.5) * 1.5)

    points.push({
      time: timeStr,
      temperature: temp,
      light,
      humidity: humid,
    })
  }
  return points
}

interface AppContextType {
  // Theme state ('light' default)
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void

  // LED States (ON / OFF only)
  l1: boolean
  setL1: (v: boolean | ((prev: boolean) => boolean)) => void
  toggleL1: () => void
  l2: boolean
  setL2: (v: boolean | ((prev: boolean) => boolean)) => void
  toggleL2: () => void
  l3: boolean
  setL3: (v: boolean | ((prev: boolean) => boolean)) => void
  toggleL3: () => void

  // Dashboard Filters
  range: RangeOption
  setRange: (r: RangeOption) => void
  sensorType: SensorTypeOption
  setSensorType: (t: SensorTypeOption) => void

  // Real-time Live Stream
  isLive: boolean
  setIsLive: (v: boolean | ((prev: boolean) => boolean)) => void
  liveSeries: ChartSeriesPoint[]
  currentTemp: number
  currentLight: number
  currentHumid: number
  tempSpark: { v: number }[]
  lightSpark: { v: number }[]
  humidSpark: { v: number }[]

  // Sensor Page State
  sensorSearch: string
  setSensorSearch: (s: string) => void
  sensorPreset: string
  setSensorPreset: (p: any) => void
  sensorFromDt: string
  setSensorFromDt: (dt: string) => void
  sensorToDt: string
  setSensorToDt: (dt: string) => void
  sensorStatusF: any
  setSensorStatusF: (st: any) => void
  sensorLimit: number
  setSensorLimit: (l: number) => void
  sensorPage: number
  setSensorPage: (p: number | ((prev: number) => number)) => void

  // History Page State
  historySearch: string
  setHistorySearch: (s: string) => void
  historyDevFilter: string
  setHistoryDevFilter: (d: string) => void
  historyActFilter: string
  setHistoryActFilter: (a: string) => void
  historyLimit: number
  setHistoryLimit: (l: number) => void
  historyPage: number
  setHistoryPage: (p: number | ((prev: number) => number)) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  // Theme state (Default 'light' for bright, radiant UI)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))

  // LED states (true = ON, false = OFF)
  const [l1, setL1] = useState(true)
  const [l2, setL2] = useState(false)
  const [l3, setL3] = useState(true)

  const toggleL1 = () => {
    setL1((prev) => {
      const next = !prev
      recordDeviceAction('LED 1', next ? 'BẬT' : 'TẮT')
      return next
    })
  }

  const toggleL2 = () => {
    setL2((prev) => {
      const next = !prev
      recordDeviceAction('LED 2', next ? 'BẬT' : 'TẮT')
      return next
    })
  }

  const toggleL3 = () => {
    setL3((prev) => {
      const next = !prev
      recordDeviceAction('LED 3', next ? 'BẬT' : 'TẮT')
      return next
    })
  }

  // Theme DOM sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'light') {
      document.body.style.backgroundColor = '#f1f5f9'
      document.body.style.color = '#0f172a'
    } else {
      document.body.style.backgroundColor = '#060d14'
      document.body.style.color = '#e8f4f8'
    }
  }, [theme])

  // Dashboard filter states
  const [range, setRange] = useState<RangeOption>('today')
  const [sensorType, setSensorType] = useState<SensorTypeOption>('all')

  // Real-time stream states
  const [isLive, setIsLive] = useState(true)
  const [liveSeries, setLiveSeries] = useState<ChartSeriesPoint[]>(createInitialLivePoints)

  const [currentTemp, setCurrentTemp] = useState(30.0)
  const [currentLight, setCurrentLight] = useState(876)
  const [currentHumid, setCurrentHumid] = useState(61)

  const [tempSpark, setTempSpark] = useState(() =>
    createInitialLivePoints().slice(-16).map((p) => ({ v: p.temperature }))
  )
  const [lightSpark, setLightSpark] = useState(() =>
    createInitialLivePoints().slice(-16).map((p) => ({ v: p.light }))
  )
  const [humidSpark, setHumidSpark] = useState(() =>
    createInitialLivePoints().slice(-16).map((p) => ({ v: p.humidity }))
  )

  const currentValuesRef = useRef({ temp: 30.0, light: 876, humid: 61 })

  // Persistent background stream generator (runs continuously every 2s)
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const prev = currentValuesRef.current

      const tempDelta = Number(((Math.random() - 0.49) * 0.45).toFixed(1))
      let newTemp = Number((prev.temp + tempDelta).toFixed(1))
      newTemp = Math.max(26.5, Math.min(33.5, newTemp))

      const lightDelta = Math.round((Math.random() - 0.49) * 32)
      let newLight = prev.light + lightDelta
      newLight = Math.max(740, Math.min(970, newLight))

      const humidDelta = Math.round((Math.random() - 0.5) * 1.8)
      let newHumid = prev.humid + humidDelta
      newHumid = Math.max(56, Math.min(74, newHumid))

      currentValuesRef.current = { temp: newTemp, light: newLight, humid: newHumid }

      setCurrentTemp(newTemp)
      setCurrentLight(newLight)
      setCurrentHumid(newHumid)

      setTempSpark((prevArr) => [...prevArr.slice(1), { v: newTemp }])
      setLightSpark((prevArr) => [...prevArr.slice(1), { v: newLight }])
      setHumidSpark((prevArr) => [...prevArr.slice(1), { v: newHumid }])

      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

      const newPoint: ChartSeriesPoint = {
        time: timeStr,
        temperature: newTemp,
        light: newLight,
        humidity: newHumid,
      }

      setLiveSeries((prevList) => [...prevList.slice(1), newPoint])
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

  // Sensor Page state
  const [sensorSearch, setSensorSearch] = useState('')
  const [sensorPreset, setSensorPreset] = useState<any>('Tất cả')
  const [sensorFromDt, setSensorFromDt] = useState('2026-08-16T00:00')
  const [sensorToDt, setSensorToDt] = useState('2026-08-16T12:00')
  const [sensorStatusF, setSensorStatusF] = useState<any>('Tất cả')
  const [sensorLimit, setSensorLimit] = useState(25)
  const [sensorPage, setSensorPage] = useState(1)

  // History Page state
  const [historySearch, setHistorySearch] = useState('')
  const [historyDevFilter, setHistoryDevFilter] = useState('all')
  const [historyActFilter, setHistoryActFilter] = useState('all')
  const [historyLimit, setHistoryLimit] = useState(25)
  const [historyPage, setHistoryPage] = useState(1)

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        l1,
        setL1,
        toggleL1,
        l2,
        setL2,
        toggleL2,
        l3,
        setL3,
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
        tempSpark,
        lightSpark,
        humidSpark,
        sensorSearch,
        setSensorSearch,
        sensorPreset,
        setSensorPreset,
        sensorFromDt,
        setSensorFromDt,
        sensorToDt,
        setSensorToDt,
        sensorStatusF,
        setSensorStatusF,
        sensorLimit,
        setSensorLimit,
        sensorPage,
        setSensorPage,
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
