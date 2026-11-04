/**
 * Mock API Service - IoT Community Hub
 * Bám sát tài liệu đặc tả yêu cầu SRS (Phụ lục B: Tài liệu API)
 * UC1, UC2, UC3, UC4, UC5
 */

export interface ChartSeriesPoint {
  time: string
  temperature: number
  light: number
  humidity: number
}

type DeviceAction = 'BẬT' | 'TẮT'
type DeviceActionStatus = 'Thành công' | 'Thất bại' | 'Đang xử lý'
type DeviceActionSource = 'Thủ công' | 'Tự động' | 'Lịch trình'

export interface DeviceActionRecord {
  id: string
  performed_at: string      // ISO 8601
  display_time: string      // "16/08 08:00:12"
  device_id: number
  device_code: string
  device_name: string
  action: DeviceAction
  status: DeviceActionStatus
  performed_by: string
  source: DeviceActionSource
}

export interface PaginatedResult<T> {
  success: boolean
  total: number
  page: number
  limit: number
  totalPages: number
  data: T[]
}

/* ────────────────────────────────────────────────────────────────────────
 * Tiện ích dùng chung
 * ──────────────────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0')

// "16/08 08:00:12"
function formatDisplayTime(d: Date, seconds = d.getSeconds()) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(seconds)}`
}

// "2026-10-13 17:11:49"
function formatTimestamp(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function paginate<T>(items: T[], page = 1, limit = 25): PaginatedResult<T> {
  const safeLimit = Math.max(1, limit)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (currentPage - 1) * safeLimit

  return {
    success: true,
    total,
    page: currentPage,
    limit: safeLimit,
    totalPages,
    data: items.slice(startIndex, startIndex + safeLimit),
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * Mock Database - Lịch sử điều khiển LED
 * ──────────────────────────────────────────────────────────────────────── */

export const DEVICES = [
  { id: 1, code: 'LED-01', name: 'LED 1' },
  { id: 2, code: 'LED-02', name: 'LED 2' },
  { id: 3, code: 'LED-03', name: 'LED 3' },
] as const
export type DeviceName = (typeof DEVICES)[number]['name']
const DEFAULT_USER = 'Minh Đức'

// Sinh 50 bản ghi lịch sử điều khiển LED
function generateMockDeviceActions(): DeviceActionRecord[] {
  const records: DeviceActionRecord[] = []
  const baseDate = new Date('2026-08-16T12:00:00')
  const sources: DeviceActionSource[] = ['Thủ công', 'Tự động', 'Lịch trình']

  for (let i = 0; i < 50; i++) {
    const minutesAgo = i * 14 + (i % 4) * 3
    const date = new Date(baseDate.getTime() - minutesAgo * 60 * 1000)
    const dev = DEVICES[i % 3]

    records.push({
      id: `#H${pad(50 - i)}`,
      performed_at: date.toISOString(),
      display_time: formatDisplayTime(date, (i * 19) % 60),
      device_id: dev.id,
      device_code: dev.code,
      device_name: dev.name,
      action: i % 2 === 0 ? 'BẬT' : 'TẮT',
      status: i % 13 === 7 ? 'Đang xử lý' : i % 6 === 2 || i % 11 === 5 ? 'Thất bại' : 'Thành công',
      performed_by: DEFAULT_USER,
      source: sources[i % sources.length],
    })
  }

  return records.reverse()
}

const mockDeviceActions = generateMockDeviceActions()

// Thông báo cho UI mỗi khi lịch sử điều khiển thay đổi
const deviceActionListeners = new Set<() => void>()
export function subscribeDeviceActions(listener: () => void) {
  deviceActionListeners.add(listener)
  return () => {
    deviceActionListeners.delete(listener)
  }
}
function notifyDeviceActions() {
  deviceActionListeners.forEach((fn) => fn())
}

export function recordDeviceAction(
  deviceName: DeviceName,
  action: DeviceAction,
  performedBy: string = DEFAULT_USER,
  source: DeviceActionSource = 'Thủ công'
) {
  const now = new Date()
  const dev = DEVICES.find((d) => d.name === deviceName)!

  const newRecord: DeviceActionRecord = {
    id: `#H${pad(mockDeviceActions.length + 1)}`,
    performed_at: now.toISOString(),
    display_time: formatDisplayTime(now),
    device_id: dev.id,
    device_code: dev.code,
    device_name: deviceName,
    action,
    status: 'Đang xử lý',
    performed_by: performedBy,
    source,
  }

  mockDeviceActions.push(newRecord)
  notifyDeviceActions()

  // Giả lập thiết bị phản hồi sau 3 giây
  setTimeout(() => {
    newRecord.status = 'Thành công'
    notifyDeviceActions()
  }, 3000)

  return newRecord
}

/* ────────────────────────────────────────────────────────────────────────
 * 1. API: UC2 - Biểu đồ dữ liệu cảm biến
 * GET /api/sensors/history?range={today|week|month}&type={all|...}
 * ──────────────────────────────────────────────────────────────────────── */

const CHART_DATA_TODAY: ChartSeriesPoint[] = [
  { time: '00:00', temperature: 24.2, light: 15,   humidity: 74 },
  { time: '02:00', temperature: 23.8, light: 10,   humidity: 76 },
  { time: '04:00', temperature: 23.5, light: 18,   humidity: 77 },
  { time: '06:00', temperature: 24.6, light: 180,  humidity: 72 },
  { time: '08:00', temperature: 26.8, light: 520,  humidity: 66 },
  { time: '10:00', temperature: 29.2, light: 890,  humidity: 61 },
  { time: '12:00', temperature: 31.4, light: 1150, humidity: 55 },
  { time: '14:00', temperature: 30.8, light: 980,  humidity: 58 },
  { time: '16:00', temperature: 28.5, light: 620,  humidity: 63 },
  { time: '18:00', temperature: 26.4, light: 210,  humidity: 67 },
  { time: '20:00', temperature: 25.1, light: 45,   humidity: 70 },
  { time: '22:00', temperature: 24.5, light: 25,   humidity: 73 },
]

const CHART_DATA_WEEK: ChartSeriesPoint[] = [
  { time: 'Thứ 2',  temperature: 27.5, light: 780, humidity: 64 },
  { time: 'Thứ 3',  temperature: 28.1, light: 840, humidity: 62 },
  { time: 'Thứ 4',  temperature: 26.9, light: 690, humidity: 68 },
  { time: 'Thứ 5',  temperature: 29.3, light: 920, humidity: 59 },
  { time: 'Thứ 6',  temperature: 28.5, light: 847, humidity: 65 },
  { time: 'Thứ 7',  temperature: 30.2, light: 1020, humidity: 57 },
  { time: 'Chủ nhật', temperature: 27.8, light: 750, humidity: 66 },
]

const CHART_DATA_MONTH: ChartSeriesPoint[] = [
  { time: '01/08', temperature: 26.5, light: 720, humidity: 68 },
  { time: '04/08', temperature: 27.2, light: 790, humidity: 65 },
  { time: '07/08', temperature: 28.0, light: 830, humidity: 63 },
  { time: '10/08', temperature: 29.1, light: 910, humidity: 60 },
  { time: '13/08', temperature: 27.8, light: 800, humidity: 64 },
  { time: '16/08', temperature: 28.5, light: 847, humidity: 65 },
  { time: '19/08', temperature: 29.4, light: 940, humidity: 58 },
  { time: '22/08', temperature: 30.1, light: 990, humidity: 57 },
  { time: '25/08', temperature: 28.2, light: 820, humidity: 62 },
  { time: '28/08', temperature: 27.0, light: 760, humidity: 67 },
  { time: '31/08', temperature: 26.8, light: 740, humidity: 69 },
]

const CHART_DATA: Record<'today' | 'week' | 'month', ChartSeriesPoint[]> = {
  today: CHART_DATA_TODAY,
  week: CHART_DATA_WEEK,
  month: CHART_DATA_MONTH,
}

export function getSensorHistory(
  range: 'today' | 'week' | 'month' = 'today',
  type: 'all' | 'temperature' | 'light' | 'humidity' = 'all'
): { range: string; type: string; series: ChartSeriesPoint[] } {
  return { range, type, series: CHART_DATA[range] }
}

/* ────────────────────────────────────────────────────────────────────────
 * 2. API: UC5 - Tra cứu lịch sử hoạt động điều khiển thiết bị (phân trang + lọc)
 * GET /api/devices/actions
 * ──────────────────────────────────────────────────────────────────────── */

export interface DeviceActionsQueryParams {
  page?: number
  limit?: number
  search?: string
  device_name?: string
  action?: string
  status?: string
  sort?: 'Newest First' | 'Oldest First'
}

export function getDeviceActions(params: DeviceActionsQueryParams): PaginatedResult<DeviceActionRecord> {
  const search = (params.search || '').trim().toLowerCase()
  const devFilter = params.device_name || 'all'
  const actFilter = params.action || 'all'
  const statusFilter = params.status || 'all'

  const filtered = mockDeviceActions.filter((item) => {
    if (devFilter !== 'all' && item.device_name !== devFilter && item.device_code !== devFilter) return false
    if (actFilter !== 'all' && item.action !== actFilter) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (!search) return true

    return [item.id, item.device_name, item.device_code, item.performed_by, item.source, item.display_time]
      .some((field) => field.toLowerCase().includes(search))
  })

  // Dữ liệu lưu theo thứ tự cũ → mới
  const sorted = params.sort === 'Oldest First' ? filtered : filtered.reverse()
  return paginate(sorted, params.page, params.limit || 25)
}

/* ────────────────────────────────────────────────────────────────────────
 * 3. API: UC4 - Tra cứu dữ liệu cảm biến theo từng lần đo (phân trang + lọc)
 * ──────────────────────────────────────────────────────────────────────── */

export interface IndividualSensorReading {
  no: number
  id: string
  type: 'Temperature' | 'Humidity' | 'Light'
  value: number
  unit: string
  formattedValue: string
  timestamp: string // "2026-10-13 17:11:49"
  rawDate: number
}

type ReadingSort =
  | 'Newest First'
  | 'Oldest First'
  | 'Value High to Low'
  | 'Value Low to High'
  | 'No Asc'
  | 'No Desc'
  | 'Id Asc'
  | 'Id Desc'
  | 'Name Asc'
  | 'Name Desc'

export interface IndividualReadingQueryParams {
  page?: number
  limit?: number
  search?: string
  type?: 'All Types' | 'Temperature' | 'Humidity' | 'Light' | 'Time'
  sort?: ReadingSort
}

const READING_COMPARATORS: Record<ReadingSort, (a: IndividualSensorReading, b: IndividualSensorReading) => number> = {
  'Newest First': (a, b) => b.rawDate - a.rawDate,
  'Oldest First': (a, b) => a.rawDate - b.rawDate,
  'Value High to Low': (a, b) => b.value - a.value,
  'Value Low to High': (a, b) => a.value - b.value,
  'No Asc': (a, b) => a.no - b.no,
  'No Desc': (a, b) => b.no - a.no,
  'Id Asc': (a, b) => a.id.localeCompare(b.id),
  'Id Desc': (a, b) => b.id.localeCompare(a.id),
  'Name Asc': (a, b) => a.type.localeCompare(b.type),
  'Name Desc': (a, b) => b.type.localeCompare(a.type),
}

const READING_UNITS: Record<IndividualSensorReading['type'], string> = {
  Temperature: '°C',
  Humidity: '%',
  Light: 'Lux',
}

function generateAllIndividualReadings(): IndividualSensorReading[] {
  const TOTAL = 9276
  const list: IndividualSensorReading[] = []
  const types: IndividualSensorReading['type'][] = ['Temperature', 'Humidity', 'Light']

  // Mốc thời gian mới nhất; mỗi chu kỳ 3 cảm biến cách nhau 5 giây
  const baseDate = new Date('2026-10-27T14:58:37')
  const STEP_SECONDS = 5

  for (let i = 0; i < TOTAL; i++) {
    const sensorType = types[i % 3]
    const cycle = Math.floor(i / 3)
    const d = new Date(baseDate.getTime() - cycle * STEP_SECONDS * 1000)

    let value: number
    if (sensorType === 'Temperature') {
      value = Number((28.4 + Math.sin(cycle / 9) * 1.6 + (i % 5) * 0.1).toFixed(1))
    } else if (sensorType === 'Humidity') {
      value = Math.round(64 + Math.cos(cycle / 11) * 6 + (i % 4))
    } else {
      value = Math.round(820 + Math.sin(cycle / 7) * 90 + (i % 7) * 6)
    }
    const unit = READING_UNITS[sensorType]

    list.push({
      no: i + 1,
      // ID dạng #Xddd: X là chữ cái in hoa (đổi mỗi 1000 bản ghi), ddd là 3 chữ số
      id: `#${String.fromCharCode(65 + Math.floor(i / 1000))}${String(i % 1000).padStart(3, '0')}`,
      type: sensorType,
      value,
      unit,
      formattedValue: `${value} ${unit}`,
      timestamp: formatTimestamp(d),
      rawDate: d.getTime(),
    })
  }

  return list
}

let cachedIndividualReadings: IndividualSensorReading[] | null = null

// Số nguyên khớp cả phần thập phân ("28" → 28.x °C), số thập phân khớp chính xác ("28.4" → 28.4 °C)
function matchesValue(value: number, search: string) {
  const normalized = search.replace(',', '.')
  const target = Number(normalized)
  if (Number.isNaN(target)) return false
  return normalized.includes('.') ? value === target : Math.trunc(value) === target
}

export function getIndividualSensorReadings(
  params: IndividualReadingQueryParams = {}
): PaginatedResult<IndividualSensorReading> {
  cachedIndividualReadings ??= generateAllIndividualReadings()

  const search = (params.search || '').trim().toLowerCase()
  const type = params.type || 'All Types'
  const sort = params.sort || 'Newest First'

  const filtered = cachedIndividualReadings.filter((item) => {
    // "Time": giữ cả 3 loại cảm biến, tìm theo chuỗi thời gian ("14:58", "2026-10-27 14:5")
    if (type === 'Time') return !search || item.timestamp.includes(search)
    if (type !== 'All Types' && item.type !== type) return false
    return !search || matchesValue(item.value, search)
  })

  return paginate(filtered.sort(READING_COMPARATORS[sort]), params.page, params.limit || 10)
}

/* ────────────────────────────────────────────────────────────────────────
 * 4. Tiện ích Xuất CSV theo chuẩn SRS
 * ──────────────────────────────────────────────────────────────────────── */

function downloadCsv(filename: string, csvContent: string) {
  // Thêm BOM UTF-8 để Microsoft Excel hiển thị tiếng Việt có dấu chuẩn xác
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportDeviceActionsCsv(records: DeviceActionRecord[]) {
  const header = 'STT,Mã bản ghi,Thời gian,Thiết bị,Hành động,Trạng thái,Người thực hiện\n'
  const rows = records
    .map((r, i) => `${i + 1},"${r.id}","${r.display_time}","${r.device_name}","${r.action}","${r.status}","${r.performed_by}"`)
    .join('\n')
  downloadCsv('lich_su_hoat_dong_iot_community.csv', header + rows)
}

export function exportIndividualReadingsCsv(records: IndividualSensorReading[]) {
  const header = 'NO,SENSOR ID,SENSOR NAME,VALUE,TIMESTAMP\n'
  const rows = records
    .map((r) => `${r.no},"${r.id}","${r.type}","${r.formattedValue}","${r.timestamp}"`)
    .join('\n')
  downloadCsv('sensor_readings.csv', header + rows)
}
