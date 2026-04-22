import type { jsPDF } from 'jspdf'
import type { Checklist, ChecklistRow } from '../types'

/**
 * 匯出 composable
 *
 * 三種格式：
 *  - exportToExcel: 透過 exceljs 產生 .xlsx
 *  - exportToPdf:   透過 jspdf + jspdf-autotable 產生 .pdf
 *  - exportToPrint: 呼叫 window.print()，搭配 @media print CSS
 *
 * 第三方套件（exceljs / jspdf / jspdf-autotable）採動態 import，避免預覽頁首屏
 * 載入 ~3MB 的匯出函式庫造成主執行緒卡頓；使用者點擊對應匯出按鈕時才下載 chunk。
 *
 * PDF 中文字型由 jsDelivr CDN 動態取得 Noto Sans TC TTF，本機快取於記憶體
 * （`cachedFontBase64`），同一個 session 僅下載一次。
 */

const PDF_FONT_URL =
  'https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-sans-tc@0.4.3/400Regular/NotoSansTC_400Regular.ttf'
const PDF_FONT_NAME = 'NotoSansTC'
const PDF_FONT_FILENAME = 'NotoSansTC-Regular.ttf'

const EXCEL_SHEET_NAME_MAX = 31 // Excel 規格限制
const TABLE_HEADERS = ['#', '圖面位置', '量具', '檢驗項目', '備註'] as const

let cachedFontBase64: string | null = null

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim()
  return cleaned || '自主檢查表'
}

function formatGauge(row: ChecklistRow): string {
  if (row.gaugeName) return row.gaugeName
  if (row.gaugeId) return '（已刪除）'
  return ''
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  // 分塊處理，避免大檔案時呼叫堆疊溢位
  const CHUNK_SIZE = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

async function loadPdfFont(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64
  let res: Response
  try {
    res = await fetch(PDF_FONT_URL)
  } catch {
    throw new Error(
      'PDF 匯出失敗：無法從網路載入中文字型（Noto Sans TC）。請確認網路連線，或改用「列印」功能並選擇「另存為 PDF」。',
    )
  }
  if (!res.ok) {
    throw new Error(
      `PDF 匯出失敗：中文字型下載錯誤（HTTP ${res.status}）。請稍後再試，或改用「列印」功能並選擇「另存為 PDF」。`,
    )
  }
  const buffer = await res.arrayBuffer()
  cachedFontBase64 = arrayBufferToBase64(buffer)
  return cachedFontBase64
}

async function buildExcelBlob(checklist: Checklist): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs')

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'speak-excel'
  workbook.created = new Date()

  const sheetName = checklist.name.slice(0, EXCEL_SHEET_NAME_MAX) || '檢查表'
  const sheet = workbook.addWorksheet(sheetName)

  sheet.columns = [{ width: 6 }, { width: 18 }, { width: 22 }, { width: 36 }, { width: 28 }]

  const titleRow = sheet.addRow([checklist.name])
  sheet.mergeCells('A1:E1')
  titleRow.height = 28
  const titleCell = sheet.getCell('A1')
  titleCell.font = { bold: true, size: 16 }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  const headerRow = sheet.addRow(TABLE_HEADERS as unknown as string[])
  headerRow.font = { bold: true }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' },
    }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  checklist.rows.forEach((row, index) => {
    const dataRow = sheet.addRow([
      index + 1,
      row.position,
      formatGauge(row),
      row.inspectionItem,
      row.remark,
    ])
    dataRow.alignment = { vertical: 'top', wrapText: true }
    dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'top' }
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

async function buildPdfDoc(checklist: Checklist): Promise<jsPDF> {
  const [{ jsPDF: JsPDF }, { autoTable }, fontBase64] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadPdfFont(),
  ])

  const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  doc.addFileToVFS(PDF_FONT_FILENAME, fontBase64)
  doc.addFont(PDF_FONT_FILENAME, PDF_FONT_NAME, 'normal')
  doc.setFont(PDF_FONT_NAME, 'normal')

  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFontSize(16)
  doc.text(checklist.name, pageWidth / 2, 42, { align: 'center' })

  autoTable(doc, {
    startY: 60,
    head: [TABLE_HEADERS as unknown as string[]],
    body: checklist.rows.map((row, index) => [
      String(index + 1),
      row.position,
      formatGauge(row),
      row.inspectionItem,
      row.remark,
    ]),
    styles: {
      font: PDF_FONT_NAME,
      fontStyle: 'normal',
      fontSize: 10,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      font: PDF_FONT_NAME,
      fontStyle: 'normal',
      fillColor: [227, 242, 253],
      textColor: [33, 33, 33],
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 90 },
      4: { cellWidth: 100 },
    },
    margin: { top: 60, right: 32, bottom: 40, left: 32 },
  })

  return doc
}

export function useExport() {
  async function exportToExcel(checklist: Checklist): Promise<void> {
    const blob = await buildExcelBlob(checklist)
    triggerDownload(blob, `${sanitizeFilename(checklist.name)}.xlsx`)
  }

  async function exportToPdf(checklist: Checklist): Promise<void> {
    const doc = await buildPdfDoc(checklist)
    doc.save(`${sanitizeFilename(checklist.name)}.pdf`)
  }

  function exportToPrint(): void {
    window.print()
  }

  return { exportToExcel, exportToPdf, exportToPrint }
}
