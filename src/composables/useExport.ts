import { ref } from 'vue'
import type { jsPDF } from 'jspdf'
import type {
  Checklist,
  ChecklistRow,
  ExcelTemplate,
  PrintTemplateCell,
  PrintTemplateData,
  PrintTemplateRow,
} from '../types'

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

// 模組層級 singleton：列印時由 ExportDialog 寫入，ChecklistPreviewView 讀取並在 @media print 渲染模板表格
export const printTemplateData = ref<PrintTemplateData | null>(null)

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

async function buildExcelBlobWithTemplate(
  checklist: Checklist,
  template: ExcelTemplate,
  templateBuffer: ArrayBuffer,
): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateBuffer)

  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('模板檔案中沒有工作表')

  checklist.rows.forEach((row, index) => {
    const excelRow = sheet.getRow(template.dataStartRow + index)
    excelRow.getCell(1).value = index + 1
    excelRow.getCell(2).value = row.position
    excelRow.getCell(3).value = formatGauge(row)
    excelRow.getCell(4).value = row.inspectionItem
    excelRow.getCell(5).value = row.remark
    excelRow.alignment = { vertical: 'top', wrapText: true }
    excelRow.getCell(1).alignment = { horizontal: 'center', vertical: 'top' }
    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    excelRow.commit()
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

async function buildFilledTemplateData(
  checklist: Checklist,
  template: ExcelTemplate,
  templateBuffer: ArrayBuffer,
): Promise<PrintTemplateData> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateBuffer)

  const sheet = workbook.worksheets[0]
  if (!sheet) return { rows: [], colWidths: [] }

  // 填入檢查表資料列（同 buildExcelBlobWithTemplate 邏輯）
  checklist.rows.forEach((row, index) => {
    const excelRow = sheet.getRow(template.dataStartRow + index)
    excelRow.getCell(1).value = index + 1
    excelRow.getCell(2).value = row.position
    excelRow.getCell(3).value = formatGauge(row)
    excelRow.getCell(4).value = row.inspectionItem
    excelRow.getCell(5).value = row.remark
    excelRow.commit()
  })

  // 提取欄寬（共 5 欄）
  const colWidths: number[] = []
  for (let c = 1; c <= 5; c++) {
    colWidths.push(sheet.getColumn(c).width ?? 10)
  }

  // 逐列逐格提取樣式資訊
  const templateRows: PrintTemplateRow[] = []
  const lastRowNum = sheet.lastRow?.number ?? 0

  for (let rowNum = 1; rowNum <= lastRowNum; rowNum++) {
    const row = sheet.getRow(rowNum)
    const cells: PrintTemplateCell[] = []

    for (let colNum = 1; colNum <= 5; colNum++) {
      const cell = row.getCell(colNum)

      // 跳過合併範圍的 slave cell
      if (cell.isMerged && cell.master.address !== cell.address) continue

      // 計算 colspan（向右掃描）
      let colspan = 1
      for (let c = colNum + 1; c <= 5; c++) {
        const nextCell = row.getCell(c)
        if (nextCell.isMerged && nextCell.master.address === cell.address) {
          colspan++
        } else {
          break
        }
      }

      // 計算 rowspan（向下掃描）
      let rowspan = 1
      for (let r = rowNum + 1; r <= lastRowNum; r++) {
        const cellBelow = sheet.getRow(r).getCell(colNum)
        if (cellBelow.isMerged && cellBelow.master.address === cell.address) {
          rowspan++
        } else {
          break
        }
      }

      // ARGB → #RRGGBB；白色（FFFFFF）回傳 null 避免覆蓋瀏覽器預設
      const fill = cell.fill as { type?: string; fgColor?: { argb?: string } } | undefined
      let backgroundColor: string | null = null
      if (fill?.type === 'pattern' && fill.fgColor?.argb) {
        const argb = fill.fgColor.argb
        if (argb.length >= 8) {
          const rgb = argb.slice(2).toUpperCase()
          if (rgb !== 'FFFFFF') backgroundColor = `#${rgb}`
        }
      }

      const hasBorder = !!(
        cell.border?.top?.style ||
        cell.border?.left?.style ||
        cell.border?.bottom?.style ||
        cell.border?.right?.style
      )

      cells.push({
        value: cell.text ?? '',
        colspan,
        rowspan,
        isBold: cell.font?.bold ?? false,
        fontSize: cell.font?.size ?? 11,
        textAlign: (cell.alignment?.horizontal as string) ?? 'left',
        verticalAlign: cell.alignment?.vertical === 'middle' ? 'middle' : 'top',
        backgroundColor,
        hasBorder,
      })
    }

    templateRows.push({
      cells,
      height: row.height ?? 15,
    })
  }

  return { rows: templateRows, colWidths }
}

async function extractTemplateSections(
  template: ExcelTemplate,
  buffer: ArrayBuffer,
): Promise<{ infoLines: string[]; columnHeaders: string[] }> {
  if (template.dataStartRow <= 1) {
    return { infoLines: [], columnHeaders: TABLE_HEADERS as unknown as string[] }
  }

  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return { infoLines: [], columnHeaders: TABLE_HEADERS as unknown as string[] }

  // row 1 ~ dataStartRow-2：公司資訊列
  const infoLines: string[] = []
  for (let rowNum = 1; rowNum <= template.dataStartRow - 2; rowNum++) {
    const row = sheet.getRow(rowNum)
    const texts: string[] = []
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.isMerged && cell.master.address !== cell.address) return
      const text = (cell.text ?? '').trim()
      if (text) texts.push(text)
    })
    if (texts.length > 0) infoLines.push(texts.join('  '))
  }

  // row dataStartRow-1：欄位標題列
  const columnHeaders: string[] = []
  const headerRowNum = template.dataStartRow - 1
  if (headerRowNum >= 1) {
    const headerRow = sheet.getRow(headerRowNum)
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.isMerged && cell.master.address !== cell.address) return
      columnHeaders.push((cell.text ?? '').trim())
    })
  }

  return {
    infoLines,
    columnHeaders: columnHeaders.length > 0 ? columnHeaders : (TABLE_HEADERS as unknown as string[]),
  }
}

async function buildPdfDoc(
  checklist: Checklist,
  headerLines?: string[],
  columnHeaders?: string[],
): Promise<jsPDF> {
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

  let titleY = 42
  let tableStartY = 60

  if (headerLines && headerLines.length > 0) {
    doc.setFontSize(10)
    let y = 20
    for (const line of headerLines) {
      y += 14
      doc.text(line, 32, y)
    }
    y += 12
    titleY = y + 16
    tableStartY = titleY + 18
  }

  doc.setFontSize(16)
  doc.text(checklist.name, pageWidth / 2, titleY, { align: 'center' })

  autoTable(doc, {
    startY: tableStartY,
    head: [columnHeaders ?? (TABLE_HEADERS as unknown as string[])],
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

  async function exportToExcelWithTemplate(
    checklist: Checklist,
    template: ExcelTemplate,
    buffer: ArrayBuffer,
  ): Promise<void> {
    const blob = await buildExcelBlobWithTemplate(checklist, template, buffer)
    triggerDownload(blob, `${sanitizeFilename(checklist.name)}.xlsx`)
  }

  async function exportToPdfWithTemplate(
    checklist: Checklist,
    template: ExcelTemplate,
    buffer: ArrayBuffer,
  ): Promise<void> {
    const { infoLines, columnHeaders } = await extractTemplateSections(template, buffer)
    const doc = await buildPdfDoc(checklist, infoLines, columnHeaders)
    doc.save(`${sanitizeFilename(checklist.name)}.pdf`)
  }

  return {
    exportToExcel,
    exportToExcelWithTemplate,
    exportToPdf,
    exportToPdfWithTemplate,
    exportToPrint,
    buildFilledTemplateData,
    extractTemplateSections,
  }
}
