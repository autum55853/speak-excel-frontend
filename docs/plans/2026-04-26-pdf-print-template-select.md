# PDF 與列印模板選擇功能

**日期**：2026-04-26  
**狀態**：進行中（已修訂需求）

## 背景

目前 Excel 匯出已有「選擇模板 / 不使用模板」的兩步驟流程，套用模板後可保留公司表頭、欄位格式與頁尾。使用者希望 PDF 匯出和列印模式也加入相同的模板選擇步驟，**且輸出結果要在視覺上接近 Excel 模板的實際樣貌**。

### 需求確認（2026-04-27）

使用者提供截圖說明：

- **橘色框外**（由模板決定）：公司名稱、地址、電話 / 傳真、欄位標題列（#、圖面位置、量具、檢驗項目、備註）、頁尾（部門、製表者）
- **橘色框內**（由頁面資料決定）：實際填入的檢查表資料列（含預留空白列）

原計畫只提取表頭純文字，**需修訂為完整渲染模板版面**。

---

## 修改範圍（4 個檔案）

### 1. `src/types/index.ts`

新增三個 interface：

```typescript
export interface PrintTemplateCell {
  value: string
  colspan: number
  rowspan: number
  isBold: boolean
  fontSize: number
  textAlign: string        // 'left' | 'center' | 'right'
  verticalAlign: string    // 'top' | 'middle'
  backgroundColor: string | null  // '#RRGGBB' 或 null
  hasBorder: boolean
}

export interface PrintTemplateRow {
  cells: PrintTemplateCell[]
  height: number           // 列高，單位 pt
}

export interface PrintTemplateData {
  rows: PrintTemplateRow[]
  colWidths: number[]      // 欄寬（Excel 字元單位），共 5 欄
}
```

---

### 2. `src/composables/useExport.ts`

#### 移除

- `export const printTemplateHeader = ref<string[]>([])`
- `extractTemplateHeaderLines(template, buffer)` 函式

#### 新增（模組層級）

```typescript
export const printTemplateData = ref<PrintTemplateData | null>(null)
```

#### 新增內部函式：`buildFilledTemplateData`

```typescript
async function buildFilledTemplateData(
  checklist: Checklist,
  template: ExcelTemplate,
  templateBuffer: ArrayBuffer,
): Promise<PrintTemplateData>
```

邏輯：
1. ExcelJS 載入模板
2. 將 checklist 資料填入 `dataStartRow` 起的資料列（同 Excel 匯出邏輯）
3. 提取欄寬（`sheet.getColumn(c).width`，共 5 欄）
4. 逐列（row 1 → `sheet.lastRow`）逐格讀取：
   - **跳過 slave cell**：`cell.isMerged && cell.master.address !== cell.address`
   - master cell 掃右（同列）與掃下（同欄）計算 `colspan` / `rowspan`
   - 提取 `cell.text`、`cell.font`、`cell.alignment`、`cell.fill.fgColor.argb`、`cell.border`
   - 背景色：ARGB → `#RRGGBB`；`FFFFFFFF`（白色）回傳 `null`
5. 回傳 `{ rows, colWidths }`

#### 修改：`buildPdfDoc`

新增選填參數 `columnHeaders?: string[]`：

- 有 `columnHeaders` → 用模板欄位標題取代硬編碼 `TABLE_HEADERS`
- 無 `columnHeaders` → 維持原本行為

#### 新增公開函式：`extractTemplateSections`（供 PDF 使用）

```typescript
async function extractTemplateSections(
  template: ExcelTemplate,
  buffer: ArrayBuffer,
): Promise<{ infoLines: string[]; columnHeaders: string[] }>
```

邏輯：
- 讀取 row 1 到 `dataStartRow - 2`（若存在）→ `infoLines`（公司資訊）
- 讀取 `dataStartRow - 1`（若存在）→ `columnHeaders`（欄位標題）
- `dataStartRow <= 1` 時回傳 `{ infoLines: [], columnHeaders: TABLE_HEADERS }`

#### 修改：`exportToPdfWithTemplate`

```typescript
async function exportToPdfWithTemplate(checklist, template, buffer): Promise<void> {
  const { infoLines, columnHeaders } = await extractTemplateSections(template, buffer)
  const doc = await buildPdfDoc(checklist, infoLines, columnHeaders)
  doc.save(...)
}
```

#### `useExport()` 回傳新增

- `buildFilledTemplateData`
- `extractTemplateSections`（舊 `extractTemplateHeaderLines` 移除）

---

### 3. `src/components/ExportDialog.vue`

#### 移除

- `import { printTemplateHeader, ... }` 中的 `printTemplateHeader`
- `extractTemplateHeaderLines` 引用

#### 新增

- `import { printTemplateData, ... }`
- 從 `useExport()` 取出 `buildFilledTemplateData`

#### 修改：列印流程（`handleSelectTemplate` 中 `format === 'print'` 段落）

```typescript
// 舊：提取純文字 → printTemplateHeader.value
// 新：提取完整 PrintTemplateData → printTemplateData.value

if (template) {
  const buffer = await getTemplateFile(template.id)
  printTemplateData.value = await buildFilledTemplateData(props.checklist, template, buffer)
} else {
  printTemplateData.value = null
}
emit('update:modelValue', false)
// wait 300ms → exportToPrint() → finally: printTemplateData.value = null
```

---

### 4. `src/views/ChecklistPreviewView.vue`

#### 移除

- `printTemplateHeader` 匯入
- `<div class="print-template-header">` 及其 CSS

#### 新增匯入

```typescript
import { printTemplateData } from '../composables/useExport'
```

#### 新增 computed（欄寬百分比）

```typescript
const colWidthPercents = computed(() => {
  const widths = printTemplateData.value?.colWidths ?? []
  if (!widths.length) return []
  const total = widths.reduce((s, w) => s + w, 0)
  return widths.map(w => Math.round((w / total) * 100))
})
```

#### 新增 HTML 模板表格區塊（`@media print` 才顯示）

```html
<div v-if="printTemplateData" class="print-excel-wrapper">
  <table class="print-excel-table">
    <colgroup>
      <col v-for="(w, i) in colWidthPercents" :key="i" :style="{ width: w + '%' }" />
    </colgroup>
    <tbody>
      <tr
        v-for="(row, rIdx) in printTemplateData.rows"
        :key="rIdx"
        :style="{ height: row.height + 'pt' }"
      >
        <td
          v-for="(cell, cIdx) in row.cells"
          :key="cIdx"
          :colspan="cell.colspan > 1 ? cell.colspan : undefined"
          :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
          :style="{
            fontWeight: cell.isBold ? 'bold' : 'normal',
            fontSize: cell.fontSize + 'pt',
            textAlign: cell.textAlign,
            verticalAlign: cell.verticalAlign,
            backgroundColor: cell.backgroundColor ?? undefined,
            border: cell.hasBorder ? '1px solid #000' : undefined,
            padding: '2pt 4pt',
          }"
        >{{ cell.value }}</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### 修改：現有 checklist card

當模板啟用時，列印模式隱藏一般預覽卡片：

```html
<v-card
  v-if="checklist"
  class="pa-6 checklist-preview"
  :class="{ 'hide-on-print': !!printTemplateData }"
>
```

#### 新增 CSS

```css
/* 模板表格：螢幕隱藏、列印顯示 */
.print-excel-wrapper {
  display: none;
}
.print-excel-table {
  width: 100%;
  border-collapse: collapse;
  font-family: sans-serif;
}

@media print {
  .print-excel-wrapper {
    display: block;
  }
  .hide-on-print {
    display: none !important;
  }
}
```

---

## 邊界情況

| 情況 | 處理方式 |
|------|---------|
| `dataStartRow = 1`（無表頭） | `extractTemplateSections` 回傳 `infoLines: []`、`columnHeaders: TABLE_HEADERS`；`buildFilledTemplateData` 仍正常提取所有列 |
| 模板 Excel 無工作表 | `worksheets[0]` undefined → 回傳 `{ rows: [], colWidths: [] }` / `{ infoLines: [], columnHeaders: TABLE_HEADERS }` |
| Merged cell slave 格 | `cell.isMerged && cell.master.address !== cell.address` → 跳過，不加入 cells 陣列 |
| Merged cell master 格 | 掃右掃下計算 colspan / rowspan |
| 白色背景（FFFFFFFF） | 回傳 `null`，不設 `backgroundColor`，避免覆蓋瀏覽器預設 |
| 列印後清理 | `try/finally` 確保 `printTemplateData.value = null` 必定執行 |
| 無模板列印 | `printTemplateData.value = null`，一般預覽卡正常列印，`hide-on-print` 不觸發 |
| 無模板 PDF | `buildPdfDoc` 無 `columnHeaders`，使用 `TABLE_HEADERS`，版面不變 |
| 模板欄位標題為空（`dataStartRow = 1`） | PDF 改用 `TABLE_HEADERS` 保底 |

---

## 驗證清單

1. **Excel 模板選擇**：無 regression
2. **PDF 無模板**：版面與改版前相同（TABLE_HEADERS、title y=42）
3. **PDF 有模板**：infoLines（公司資訊）顯示於標題上方；表格欄位標題來自模板
4. **列印無模板**：輸出與改版前相同（一般預覽卡）
5. **列印有模板**：模板 HTML 表格出現（含公司表頭、欄位標題、資料列、頁尾）；螢幕上不可見
6. **列印後清理**：`printTemplateData` 歸 null，模板表格從 DOM 移除
7. **Merged cell**：公司名稱等合併儲存格正確顯示 colspan
8. **`dataStartRow = 1` 模板**：效果同「不使用模板」
9. **UI**：三種格式對話框標題正確顯示（選擇 Excel / PDF / 列印模板）
