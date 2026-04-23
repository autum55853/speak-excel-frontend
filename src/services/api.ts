import { request } from './http'
import { ApiError } from './apiError'
import type { Checklist, ChecklistInput, ChecklistSummary, ChecklistUpdate, Gauge, ChecklistRow } from '../types'

/**
 * API Service Layer
 *
 * 公開函式簽名與 localStorage 版本一致，內部改為呼叫 speak-excel-api。
 * 後端使用 snake_case；此層負責雙向轉換，讓上層元件無須感知差異。
 */

// ---------- 後端內部型別（snake_case）----------

interface BackendGauge {
  id: string
  name: string
  created_at: string
}

interface BackendChecklistRow {
  id: string
  checklist_id: string
  sort_order: number
  position: string | null
  gauge_id: string | null
  inspection_item: string | null
  remark: string | null
}

interface BackendChecklist {
  id: string
  name: string
  created_at: string
  updated_at: string
  checklist_rows?: BackendChecklistRow[]
}

// ---------- 前端驗證 ----------

const MAX_NAME_LENGTHS = {
  checklist: 200,
  gauge: 100,
} as const

function sanitizeChecklistName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('文件名稱不可為空')
  if (trimmed.length > MAX_NAME_LENGTHS.checklist) {
    throw new Error(`文件名稱不可超過 ${MAX_NAME_LENGTHS.checklist} 字元`)
  }
  return trimmed
}

function sanitizeGaugeName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('量具名稱不可為空')
  if (trimmed.length > MAX_NAME_LENGTHS.gauge) {
    throw new Error(`量具名稱不可超過 ${MAX_NAME_LENGTHS.gauge} 字元`)
  }
  return trimmed
}

// ---------- 資料對應：後端 → 前端 ----------

function mapGauge(g: BackendGauge): Gauge {
  return { id: g.id, name: g.name, createdAt: g.created_at }
}

function mapRow(r: BackendChecklistRow, gaugeMap: Map<string, string>): ChecklistRow {
  return {
    id: r.id,
    position: r.position ?? '',
    gaugeId: r.gauge_id ?? '',
    gaugeName: r.gauge_id ? (gaugeMap.get(r.gauge_id) ?? '') : '',
    inspectionItem: r.inspection_item ?? '',
    remark: r.remark ?? '',
  }
}

function mapChecklist(c: BackendChecklist, gaugeMap: Map<string, string>): Checklist {
  return {
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    rows: (c.checklist_rows ?? []).map((r) => mapRow(r, gaugeMap)),
  }
}

function mapChecklistSummary(c: BackendChecklist): ChecklistSummary {
  return { id: c.id, name: c.name, createdAt: c.created_at, updatedAt: c.updated_at }
}

// ---------- 資料對應：前端 → 後端 ----------

function serializeRows(rows: ChecklistRow[]): object[] {
  return rows.map((row, idx) => ({
    sort_order: idx + 1,
    position: row.position || null,
    gauge_id: row.gaugeId || null,
    inspection_item: row.inspectionItem || null,
    remark: row.remark || null,
  }))
}

// ---------- 內部共用 helper ----------

async function fetchGaugeMap(): Promise<Map<string, string>> {
  const gauges = await request<BackendGauge[]>('/gauges')
  return new Map(gauges.map((g) => [g.id, g.name]))
}

async function fetchChecklistById(id: string, gaugeMap: Map<string, string>): Promise<Checklist> {
  const data = await request<BackendChecklist>(`/checklists/${id}`)
  return mapChecklist(data, gaugeMap)
}

// ---------- Checklist ----------

export async function getChecklists(): Promise<ChecklistSummary[]> {
  const data = await request<BackendChecklist[]>('/checklists')
  return data.map(mapChecklistSummary)
}

export async function getChecklist(id: string): Promise<Checklist | null> {
  try {
    const gaugeMap = await fetchGaugeMap()
    return await fetchChecklistById(id, gaugeMap)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function createChecklist(data: ChecklistInput): Promise<Checklist> {
  const name = sanitizeChecklistName(data.name)
  const created = await request<BackendChecklist>('/checklists', {
    method: 'POST',
    body: JSON.stringify({ name, rows: serializeRows(data.rows ?? []) }),
  })
  // POST 回傳不含 rows，重新 fetch 取得完整資料
  const gaugeMap = await fetchGaugeMap()
  return fetchChecklistById(created.id, gaugeMap)
}

export async function updateChecklist(id: string, data: ChecklistUpdate): Promise<Checklist> {
  // 後端為 PUT 全量替換，若前端只傳部分欄位，先 fetch 補齊
  let name: string
  let rows: ChecklistRow[]

  if (data.name !== undefined && data.rows !== undefined) {
    name = sanitizeChecklistName(data.name)
    rows = data.rows
  } else {
    const gaugeMap = await fetchGaugeMap()
    const current = await fetchChecklistById(id, gaugeMap)
    name = data.name !== undefined ? sanitizeChecklistName(data.name) : current.name
    rows = data.rows !== undefined ? data.rows : current.rows
  }

  await request<void>(`/checklists/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, rows: serializeRows(rows) }),
  })

  // PUT 回傳 204，重新 fetch 取得更新後資料
  const gaugeMap = await fetchGaugeMap()
  return fetchChecklistById(id, gaugeMap)
}

export async function deleteChecklist(id: string): Promise<void> {
  await request<void>(`/checklists/${id}`, { method: 'DELETE' })
}

// ---------- Gauge ----------

export async function getGauges(): Promise<Gauge[]> {
  const data = await request<BackendGauge[]>('/gauges')
  return data.map(mapGauge)
}

export async function createGauge(name: string): Promise<Gauge> {
  const cleanName = sanitizeGaugeName(name)
  const data = await request<BackendGauge>('/gauges', {
    method: 'POST',
    body: JSON.stringify({ name: cleanName }),
  })
  return mapGauge(data)
}

export async function deleteGauge(id: string): Promise<void> {
  await request<void>(`/gauges/${id}`, { method: 'DELETE' })
}
