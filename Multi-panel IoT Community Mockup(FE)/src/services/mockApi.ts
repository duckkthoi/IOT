/**
 * Mock API Service - IoT Community Hub
 * Bám sát tài liệu đặc tả yêu cầu SRS (Phụ lục B: Tài liệu API)
 * UC1, UC2, UC3, UC4, UC5
 */

export interface SensorDataRecord {
  id: string
  recorded_at: string       // ISO 8601
  display_time: string      // "16/08 08:00:12"
  temperature: number       // °C
  light: number             // Lx
  humidity: number          // %
  status: 'normal' | 'warning'
  status_label: 'Bình thường' | 'Cảnh báo'
}

export interface ChartSeriesPoint {
  time: string
  temperature: number
  light: number
  humidity: number
}

export interface DeviceActionRecord {
  id: string
  performed_at: string      // ISO 8601
  display_time: string      // "16/08 08:00:12"
  device_id: number
  device_code: string
  device_name: string
  action: 'BẬT' | 'TẮT'
  status: 'Thành công' | 'Thất bại'
  performed_by: string
  source: 'Thủ công' | 'Tự động' | 'Lịch trình'
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
 * Mock Database - Dữ liệu khởi tạo chi tiết
 * ──────────────────────────────────────────────────────────────────────── */

// Sinh 60 bản ghi đo cảm biến bám sát 16/08/2026
function generateMockSensorData(): SensorDataRecord[] {
  const records: SensorDataRecord[] = []
  const baseDate = new Date('2026-08-16T12:00:00')

  for (let i = 0; i < 60; i++) {
    // Lùi dần thời gian mỗi bản ghi 10 - 15 phút
    const minutesAgo = i * 11 + (i % 3) * 2
    const date = new Date(baseDate.getTime() - minutesAgo * 60 * 1000)

    const hour = date.getHours()
    // Nhiệt độ dao động theo giờ: đêm mát 24-26°C, trưa nóng 28-32°C
    const tempBase = hour >= 10 && hour <= 14 ? 29.5 : hour >= 6 && hour < 10 ? 26.5 : 24.8
    const tempNoise = Number(((i % 7) * 0.4 - 1.2).toFixed(1))
    const temp = Number((tempBase + tempNoise).toFixed(1))

    // Ánh sáng dao động theo giờ: đêm 5-50 lx, sáng 400-800 lx, trưa 900-1250 lx
    let light = 300
    if (hour < 6) light = 10 + (i % 5) * 8
    else if (hour < 9) light = 350 + (i % 6) * 75
    else if (hour <= 12) light = 820 + (i % 8) * 55
    else light = 700 - (i % 5) * 60

    // Độ ẩm nghịch với nhiệt độ: 50% - 72%
    const humid = Math.max(48, Math.min(78, Math.round(75 - (temp - 24) * 3 + (i % 4) * 2)))

    // Ngưỡng cảnh báo: temp > 30°C hoặc light > 1050 hoặc humid < 52
    const isWarning = temp > 30.0 || light > 1050 || humid < 52 || i === 2 || i === 4 || i === 10

    const dayStr = String(date.getDate()).padStart(2, '0')
    const monStr = String(date.getMonth() + 1).padStart(2, '0')
    const hStr = String(date.getHours()).padStart(2, '0')
    const mStr = String(date.getMinutes()).padStart(2, '0')
    const sStr = String((i * 17) % 60).padStart(2, '0')

    const idNum = String(60 - i).padStart(3, '0')

    records.push({
      id: `#${idNum}`,
      recorded_at: date.toISOString(),
      display_time: `${dayStr}/${monStr} ${hStr}:${mStr}:${sStr}`,
      temperature: temp,
      light,
      humidity: humid,
      status: isWarning ? 'warning' : 'normal',
      status_label: isWarning ? 'Cảnh báo' : 'Bình thường',
    })
  }

  // Đảo lại để xếp ID tăng dần mặc định
  return records.reverse()
}

// Sinh 50 bản ghi lịch sử điều khiển LED
function generateMockDeviceActions(): DeviceActionRecord[] {
  const records: DeviceActionRecord[] = []
  const baseDate = new Date('2026-08-16T12:00:00')
  const devices = [
    { id: 1, code: 'LED-01', name: 'LED 1' },
    { id: 2, code: 'LED-02', name: 'LED 2' },
    { id: 3, code: 'LED-03', name: 'LED 3' },
  ]
  const users = ['Minh Đức']
  const sources: ('Thủ công' | 'Tự động' | 'Lịch trình')[] = ['Thủ công', 'Tự động', 'Lịch trình']

  for (let i = 0; i < 50; i++) {
    const minutesAgo = i * 14 + (i % 4) * 3
    const date = new Date(baseDate.getTime() - minutesAgo * 60 * 1000)

    const dev = devices[i % 3]
    const action: 'BẬT' | 'TẮT' = (i % 2 === 0) ? 'BẬT' : 'TẮT'
    const user = users[i % users.length]
    const source = sources[i % sources.length]

    const dayStr = String(date.getDate()).padStart(2, '0')
    const monStr = String(date.getMonth() + 1).padStart(2, '0')
    const hStr = String(date.getHours()).padStart(2, '0')
    const mStr = String(date.getMinutes()).padStart(2, '0')
    const sStr = String((i * 19) % 60).padStart(2, '0')

    const idNum = String(50 - i).padStart(2, '0')

    records.push({
      id: `#H${idNum}`,
      performed_at: date.toISOString(),
      display_time: `${dayStr}/${monStr} ${hStr}:${mStr}:${sStr}`,
      device_id: dev.id,
      device_code: dev.code,
      device_name: dev.name,
      action,
      status: i % 6 === 2 || i % 11 === 5 ? 'Thất bại' : 'Thành công',
      performed_by: user,
      source,
    })
  }

  return records.reverse()
}

// In-memory data stores
let mockSensorData = generateMockSensorData()
let mockDeviceActions = generateMockDeviceActions()

export function recordDeviceAction(
  deviceName: string,
  action: 'BẬT' | 'TẮT',
  performedBy: string = 'Minh Đức',
  source: 'Thủ công' | 'Tự động' | 'Lịch trình' = 'Thủ công'
) {
  const now = new Date()
  const dayStr = String(now.getDate()).padStart(2, '0')
  const monStr = String(now.getMonth() + 1).padStart(2, '0')
  const hStr = String(now.getHours()).padStart(2, '0')
  const mStr = String(now.getMinutes()).padStart(2, '0')
  const sStr = String(now.getSeconds()).padStart(2, '0')

  const devMap: Record<string, { id: number; code: string }> = {
    'LED 1': { id: 1, code: 'LED-01' },
    'LED 2': { id: 2, code: 'LED-02' },
    'LED 3': { id: 3, code: 'LED-03' },
  }
  const dev = devMap[deviceName] || { id: 1, code: 'LED-01' }
  const newId = `#H${String(mockDeviceActions.length + 1).padStart(2, '0')}`

  const newRecord: DeviceActionRecord = {
    id: newId,
    performed_at: now.toISOString(),
    display_time: `${dayStr}/${monStr} ${hStr}:${mStr}:${sStr}`,
    device_id: dev.id,
    device_code: dev.code,
    device_name: deviceName,
    action,
    status: 'Thành công',
    performed_by: performedBy,
    source,
  }

  mockDeviceActions.push(newRecord)
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

export function getSensorHistory(
  range: 'today' | 'week' | 'month' = 'today',
  type: 'all' | 'temperature' | 'light' | 'humidity' = 'all'
): { range: string; type: string; series: ChartSeriesPoint[] } {
  let rawSeries: ChartSeriesPoint[] = CHART_DATA_TODAY
  if (range === 'week') rawSeries = CHART_DATA_WEEK
  else if (range === 'month') rawSeries = CHART_DATA_MONTH

  return {
    range,
    type,
    series: rawSeries,
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 2. API: UC4 - Tra cứu dữ liệu cảm biến (phân trang + lọc)
 * GET /api/sensors/data
 * ──────────────────────────────────────────────────────────────────────── */

export interface SensorQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'normal' | 'warning'
  time_range?: 'all' | '1h' | '3h' | '6h' | 'today' | 'custom'
  from?: string
  to?: string
}

export function getSensorData(params: SensorQueryParams): PaginatedResult<SensorDataRecord> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, params.limit || 25)
  const search = (params.search || '').trim().toLowerCase()
  const status = params.status || 'all'
  const timeRange = params.time_range || 'all'

  const now = new Date('2026-08-16T12:00:00')

  // Lọc dữ liệu
  let filtered = mockSensorData.filter(item => {
    // 1. Lọc theo trạng thái
    if (status !== 'all' && item.status !== status) {
      return false
    }

    // 2. Lọc theo thời gian
    const itemDate = new Date(item.recorded_at)
    if (timeRange === '1h') {
      const start = new Date(now.getTime() - 1 * 3600 * 1000)
      if (itemDate < start || itemDate > now) return false
    } else if (timeRange === '3h') {
      const start = new Date(now.getTime() - 3 * 3600 * 1000)
      if (itemDate < start || itemDate > now) return false
    } else if (timeRange === '6h') {
      const start = new Date(now.getTime() - 6 * 3600 * 1000)
      if (itemDate < start || itemDate > now) return false
    } else if (timeRange === 'today') {
      const start = new Date('2026-08-16T00:00:00')
      if (itemDate < start || itemDate > now) return false
    } else if (timeRange === 'custom') {
      if (params.from) {
        const fromDate = new Date(params.from)
        if (itemDate < fromDate) return false
      }
      if (params.to) {
        const toDate = new Date(params.to)
        if (itemDate > toDate) return false
      }
    }

    // 3. Lọc theo từ khoá
    if (search) {
      const matchId = item.id.toLowerCase().includes(search)
      const matchTime = item.display_time.toLowerCase().includes(search)
      const matchTemp = String(item.temperature).includes(search)
      const matchLight = String(item.light).includes(search)
      const matchHumid = String(item.humidity).includes(search)
      const matchStatus = item.status_label.toLowerCase().includes(search)
      if (!matchId && !matchTime && !matchTemp && !matchLight && !matchHumid && !matchStatus) {
        return false
      }
    }

    return true
  })

  // Sắp xếp bản ghi mới nhất lên đầu
  const sorted = [...filtered].reverse()

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * limit
  const pagedData = sorted.slice(startIndex, startIndex + limit)

  return {
    success: true,
    total,
    page: currentPage,
    limit,
    totalPages,
    data: pagedData,
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 3. API: UC5 - Tra cứu lịch sử hoạt động điều khiển thiết bị (phân trang + lọc)
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
  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, params.limit || 25)
  const search = (params.search || '').trim().toLowerCase()
  const devFilter = params.device_name || 'all'
  const actFilter = params.action || 'all'
  const statusFilter = params.status || 'all'

  let filtered = mockDeviceActions.filter(item => {
    // 1. Lọc theo thiết bị
    if (devFilter !== 'all' && item.device_name !== devFilter && item.device_code !== devFilter) {
      return false
    }

    // 2. Lọc theo hành động
    if (actFilter !== 'all' && item.action !== actFilter) {
      return false
    }

    // 3. Lọc theo trạng thái
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false
    }

    // 4. Tìm kiếm
    if (search) {
      const matchId = item.id.toLowerCase().includes(search)
      const matchDev = item.device_name.toLowerCase().includes(search) || item.device_code.toLowerCase().includes(search)
      const matchUser = item.performed_by.toLowerCase().includes(search)
      const matchSrc = item.source.toLowerCase().includes(search)
      const matchTime = item.display_time.toLowerCase().includes(search)
      if (!matchId && !matchDev && !matchUser && !matchSrc && !matchTime) {
        return false
      }
    }

    return true
  })

  const sorted = params.sort === 'Oldest First' ? [...filtered] : [...filtered].reverse()
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * limit
  const pagedData = sorted.slice(startIndex, startIndex + limit)

  return {
    success: true,
    total,
    page: currentPage,
    limit,
    totalPages,
    data: pagedData,
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * 4. Tiện ích Xuất CSV theo chuẩn SRS
 * ──────────────────────────────────────────────────────────────────────── */

export function downloadCsv(filename: string, csvContent: string) {
  // Thêm BOM UTF-8 để Microsoft Excel hiển thị tiếng Việt có dấu chuẩn xác
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportSensorDataCsv(records: SensorDataRecord[]) {
  const header = 'Mã bản ghi,Thời gian,Nhiệt độ (°C),Ánh sáng (Lx),Độ ẩm (%),Trạng thái\n'
  const rows = records.map(r =>
    `"${r.id}","${r.display_time}",${r.temperature},${r.light},${r.humidity},"${r.status_label}"`
  ).join('\n')
  downloadCsv('du_lieu_cam_bien_iot_community.csv', header + rows)
}

export function exportDeviceActionsCsv(records: DeviceActionRecord[]) {
  const header = 'STT,Mã bản ghi,Thời gian,Thiết bị,Hành động,Trạng thái,Người thực hiện\n'
  const rows = records.map((r, i) =>
    `${i + 1},"${r.id}","${r.display_time}","${r.device_name}","${r.action}","${r.status}","${r.performed_by}"`
  ).join('\n')
  downloadCsv('lich_su_hoat_dong_iot_community.csv', header + rows)
}

/* ────────────────────────────────────────────────────────────────────────
 * 5. API: Individual Sensor Readings Template (bám sát template UI)
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

export interface IndividualReadingQueryParams {
  page?: number
  limit?: number
  search?: string
  type?: 'All Types' | 'Temperature' | 'Humidity' | 'Light'
  sort?:
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
}

let cachedIndividualReadings: IndividualSensorReading[] | null = null

function generateAllIndividualReadings(): IndividualSensorReading[] {
  const TOTAL = 9276
  const list: IndividualSensorReading[] = []
  const types: Array<'Temperature' | 'Humidity' | 'Light'> = ['Temperature', 'Humidity', 'Light']

  // Mốc thời gian mới nhất; mỗi chu kỳ 3 cảm biến cách nhau 5 giây
  const baseDate = new Date('2026-10-27T14:58:37')
  const STEP_SECONDS = 5

  const pad = (n: number) => String(n).padStart(2, '0')

  for (let i = 0; i < TOTAL; i++) {
    const sensorType = types[i % 3]
    const cycle = Math.floor(i / 3)
    const d = new Date(baseDate.getTime() - cycle * STEP_SECONDS * 1000)
    const timeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

    // ID dạng #Xddd: X là chữ cái in hoa (đổi mỗi 1000 bản ghi), ddd là 3 chữ số
    const id = `#${String.fromCharCode(65 + Math.floor(i / 1000))}${String(i % 1000).padStart(3, '0')}`

    let val = 0
    let unit = ''
    let formatted = ''

    if (sensorType === 'Temperature') {
      val = Number((28.4 + Math.sin(cycle / 9) * 1.6 + (i % 5) * 0.1).toFixed(1))
      unit = '°C'
      formatted = `${val} °C`
    } else if (sensorType === 'Humidity') {
      val = Math.round(64 + Math.cos(cycle / 11) * 6 + (i % 4))
      unit = '%'
      formatted = `${val} %`
    } else {
      val = Math.round(820 + Math.sin(cycle / 7) * 90 + (i % 7) * 6)
      unit = 'Lux'
      formatted = `${val} Lux`
    }

    list.push({
      no: i + 1,
      id,
      type: sensorType,
      value: val,
      unit,
      formattedValue: formatted,
      timestamp: timeStr,
      rawDate: d.getTime(),
    })
  }

  return list
}

export function getIndividualSensorReadings(
  params: IndividualReadingQueryParams = {}
): PaginatedResult<IndividualSensorReading> {
  if (!cachedIndividualReadings) {
    cachedIndividualReadings = generateAllIndividualReadings()
  }

  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, params.limit || 10)
  const search = (params.search || '').trim().toLowerCase()
  const type = params.type || 'All Types'
  const sort = params.sort || 'Newest First'

  const filtered = cachedIndividualReadings.filter((item) => {
    if (type !== 'All Types' && item.type !== type) {
      return false
    }
    if (search) {
      const matchId = item.id.toLowerCase().includes(search)
      const matchType = item.type.toLowerCase().includes(search)
      const matchVal =
        item.formattedValue.toLowerCase().includes(search) ||
        String(item.value).includes(search)
      const matchTime = item.timestamp.includes(search)
      const matchNo = String(item.no).includes(search)
      if (!matchId && !matchType && !matchVal && !matchTime && !matchNo) {
        return false
      }
    }
    return true
  })

  // Sắp xếp
  const sorted = [...filtered]
  if (sort === 'Newest First') {
    sorted.sort((a, b) => b.rawDate - a.rawDate)
  } else if (sort === 'Oldest First') {
    sorted.sort((a, b) => a.rawDate - b.rawDate)
  } else if (sort === 'Value High to Low') {
    sorted.sort((a, b) => b.value - a.value)
  } else if (sort === 'Value Low to High') {
    sorted.sort((a, b) => a.value - b.value)
  } else if (sort === 'No Asc') {
    sorted.sort((a, b) => a.no - b.no)
  } else if (sort === 'No Desc') {
    sorted.sort((a, b) => b.no - a.no)
  } else if (sort === 'Id Asc') {
    sorted.sort((a, b) => a.id.localeCompare(b.id))
  } else if (sort === 'Id Desc') {
    sorted.sort((a, b) => b.id.localeCompare(a.id))
  } else if (sort === 'Name Asc') {
    sorted.sort((a, b) => a.type.localeCompare(b.type))
  } else if (sort === 'Name Desc') {
    sorted.sort((a, b) => b.type.localeCompare(a.type))
  }

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * limit
  const pagedData = sorted.slice(startIndex, startIndex + limit)

  return {
    success: true,
    total,
    page: currentPage,
    limit,
    totalPages,
    data: pagedData,
  }
}

export function exportIndividualReadingsCsv(records: IndividualSensorReading[]) {
  const header = 'NO,SENSOR ID,SENSOR NAME,VALUE,TIMESTAMP\n'
  const rows = records
    .map(
      (r) =>
        `${r.no},"${r.id}","${r.type}","${r.formattedValue}","${r.timestamp}"`
    )
    .join('\n')
  downloadCsv('sensor_readings.csv', header + rows)
}

