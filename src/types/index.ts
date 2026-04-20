/**
 * 全域 TypeScript 型別定義
 * 所有 interface 集中於此，禁止在元件內散落定義。
 */

export interface ChecklistRow {
  id: string
  position: string
  gaugeId: string
  gaugeName: string
  inspectionItem: string
  remark: string
}

export interface Checklist {
  id: string
  name: string
  rows: ChecklistRow[]
  createdAt: string
  updatedAt: string
}

export interface ChecklistSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Gauge {
  id: string
  name: string
  createdAt: string
}

export type ChecklistInput = Omit<Checklist, 'id' | 'createdAt' | 'updatedAt'>

export type ChecklistUpdate = Partial<Pick<Checklist, 'name' | 'rows'>>

export type ExportFormat = 'excel' | 'pdf' | 'print'
