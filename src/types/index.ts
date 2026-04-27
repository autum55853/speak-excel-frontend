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

export interface ExcelTemplate {
  id: string
  name: string
  filename: string
  dataStartRow: number
  createdAt: string
}

export interface PrintTemplateCell {
  value: string
  colspan: number
  rowspan: number
  isBold: boolean
  fontSize: number
  textAlign: string
  verticalAlign: string
  backgroundColor: string | null
  hasBorder: boolean
}

export interface PrintTemplateRow {
  cells: PrintTemplateCell[]
  height: number
}

export interface PrintTemplateData {
  rows: PrintTemplateRow[]
  colWidths: number[]
}
