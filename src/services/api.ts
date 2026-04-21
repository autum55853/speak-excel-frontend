import { v4 as uuidv4 } from 'uuid'
import type { Checklist, ChecklistInput, ChecklistSummary, ChecklistUpdate, Gauge } from '../types'

/**
 * API Service Layer
 *
 * 目前以 localStorage 模擬後端，Phase 5 將整支替換為呼叫
 * `VITE_API_BASE_URL` 對應的 speak-excel-api（Express + Supabase）。
 * 頁面與元件一律透過此模組存取資料，禁止直接操作 localStorage / fetch。
 *
 * 所有公開函式皆為 async，保持與未來後端呼叫一致的簽名。
 */

const STORAGE_KEYS = {
  checklists: 'checklists',
  gauges: 'gauges',
} as const

const MAX_NAME_LENGTHS = {
  checklist: 200,
  gauge: 100,
} as const

function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeStore<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function nowIso(): string {
  return new Date().toISOString()
}

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

// ---------- Checklist ----------

export async function getChecklists(): Promise<ChecklistSummary[]> {
  return readStore<Checklist>(STORAGE_KEYS.checklists)
    .map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export async function getChecklist(id: string): Promise<Checklist | null> {
  return readStore<Checklist>(STORAGE_KEYS.checklists).find((c) => c.id === id) ?? null
}

export async function createChecklist(data: ChecklistInput): Promise<Checklist> {
  const now = nowIso()
  const checklist: Checklist = {
    id: uuidv4(),
    name: sanitizeChecklistName(data.name),
    rows: data.rows ?? [],
    createdAt: now,
    updatedAt: now,
  }
  const all = readStore<Checklist>(STORAGE_KEYS.checklists)
  all.push(checklist)
  writeStore(STORAGE_KEYS.checklists, all)
  return checklist
}

export async function updateChecklist(id: string, data: ChecklistUpdate): Promise<Checklist> {
  const all = readStore<Checklist>(STORAGE_KEYS.checklists)
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error(`找不到檢查表：${id}`)
  const current = all[idx]
  const next: Checklist = {
    ...current,
    ...(data.name !== undefined ? { name: sanitizeChecklistName(data.name) } : {}),
    ...(data.rows !== undefined ? { rows: data.rows } : {}),
    updatedAt: nowIso(),
  }
  all[idx] = next
  writeStore(STORAGE_KEYS.checklists, all)
  return next
}

export async function deleteChecklist(id: string): Promise<void> {
  const all = readStore<Checklist>(STORAGE_KEYS.checklists)
  writeStore(
    STORAGE_KEYS.checklists,
    all.filter((c) => c.id !== id),
  )
}

// ---------- Gauge ----------

export async function getGauges(): Promise<Gauge[]> {
  return readStore<Gauge>(STORAGE_KEYS.gauges).sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-Hant'),
  )
}

export async function createGauge(name: string): Promise<Gauge> {
  const cleanName = sanitizeGaugeName(name)
  const all = readStore<Gauge>(STORAGE_KEYS.gauges)
  if (all.some((g) => g.name === cleanName)) {
    throw new Error(`量具「${cleanName}」已存在`)
  }
  const gauge: Gauge = {
    id: uuidv4(),
    name: cleanName,
    createdAt: nowIso(),
  }
  all.push(gauge)
  writeStore(STORAGE_KEYS.gauges, all)
  return gauge
}

export async function deleteGauge(id: string): Promise<void> {
  const all = readStore<Gauge>(STORAGE_KEYS.gauges)
  writeStore(
    STORAGE_KEYS.gauges,
    all.filter((g) => g.id !== id),
  )
}
