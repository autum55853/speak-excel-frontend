# Excel 模板匯出功能

**日期**：2026-04-23  
**狀態**：✅ 完成（2026-04-24）

## 需求說明

匯出 Excel 時，讓使用者選擇自訂的 .xlsx 模板（例如含公司抬頭、Logo、自訂版型）。  
系統將模板作為基底，從指定列（`data_start_row`）開始填入檢查表資料，其餘版頭區域完整保留。  
若沒有模板或選擇「不使用模板」，維持現有預設匯出邏輯不變。

## 模板設計原則

- 使用者在 Excel 設計版頭（公司名稱、欄位標題等），上傳時指定「資料起始列」
- 欄位順序固定（同現有匯出）：A=序號, B=圖面位置, C=量具, D=檢驗項目, E=備註
- ExcelJS `workbook.xlsx.load(buffer)` 載入模板後，從 `data_start_row` 填入資料（client-side，與現有匯出一致）

---

## 後端（speak-excel-api）

### 1. Supabase — 新增資料表

```sql
CREATE TABLE excel_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  filename       VARCHAR(255) NOT NULL,
  storage_path   TEXT NOT NULL UNIQUE,
  data_start_row INT NOT NULL DEFAULT 2 CHECK (data_start_row >= 1 AND data_start_row <= 1000),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Supabase — 新增 Storage bucket

- Bucket 名稱：`excel-templates`
- 私有（Service Role Key 存取）
- 上限：5 MB
- 允許 MIME：`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### 3. 安裝依賴

```
npm install multer && npm install -D @types/multer
```

### 4. 新增 `src/routes/templates.ts`

| 路由 | 說明 |
|------|------|
| `GET /api/templates` | 回傳所有模板元資料（不含二進位） |
| `POST /api/templates` | multipart/form-data 上傳（`name`, `data_start_row`, `file`） |
| `GET /api/templates/:id/file` | 下載模板原始 xlsx（回傳 Buffer） |
| `DELETE /api/templates/:id` | 先刪 DB，再刪 Storage |

**POST 邏輯**：驗證 → DB insert（取得 id）→ Storage upload（`templates/{id}.xlsx`）→ 若 Storage 失敗則 rollback（delete DB row）

### 5. `src/app.ts` — 掛載路由

```typescript
import { templatesRouter } from './routes/templates.js'
app.use('/api/templates', templatesRouter)
```

---

## 前端（speak-excel/frontend）

### 6. `src/types/index.ts` — 新增型別

```typescript
export interface ExcelTemplate {
  id: string
  name: string
  filename: string
  dataStartRow: number  // 對應後端 data_start_row
  createdAt: string
}
```

### 7. `src/services/api.ts` — 新增 API 函式

```typescript
getTemplates(): Promise<ExcelTemplate[]>
uploadTemplate(name: string, file: File, dataStartRow: number): Promise<ExcelTemplate>
deleteTemplate(id: string): Promise<void>
getTemplateFile(id: string): Promise<ArrayBuffer>
```

> **注意**：`uploadTemplate` 與 `getTemplateFile` 必須直接呼叫 `fetch`，不能透過 `http.ts` 的 `request()`。
> 原因：`request()` 強制設 `Content-Type: application/json`，會覆蓋 FormData 的 boundary。

### 8. `src/composables/useExport.ts` — 新增模板匯出函式

新增模組層級函式 `buildExcelBlobWithTemplate(checklist, template, templateBuffer)`:

```typescript
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
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      }
    })
    excelRow.commit()
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
```

在 `useExport()` 回傳物件加入 `exportToExcelWithTemplate(checklist, template, buffer)`。

### 9. `src/components/ExportDialog.vue` — 新增模板選擇步驟

新增兩步驟流程（只影響 Excel 格式，PDF/列印不動）：

```
使用者點 Excel → 切換到 template-select 步驟 + 載入模板清單
    ↓
顯示「不使用模板」+ 各模板
    ↓
選擇後執行對應匯出邏輯
```

新增 refs：
- `currentStep: Ref<'format-select' | 'template-select'>`
- `templates`, `templatesLoading`, `templatesError`
- `processingTemplateId`（追蹤哪個選項顯示 spinner）

### 10. 新增 `src/views/TemplateManageView.vue`

參考 `GaugeManageView.vue` 風格：
- 上傳表單：模板名稱（max 100）、資料起始列（正整數，預設 2）、`v-file-input`（限 .xlsx）、上傳按鈕
- `v-data-table`：顯示名稱、資料起始列、建立時間、刪除操作
- 刪除須顯示確認對話框

### 11. `src/router/index.ts` — 新增路由

```typescript
{
  path: '/templates',
  name: 'templates',
  component: () => import('../views/TemplateManageView.vue'),
}
```

### 12. `src/App.vue` — 新增導覽項目

```typescript
{ title: '模板管理', icon: 'mdi-file-table-outline', to: { name: 'templates' } }
// 加在「量具管理」之後
```

---

## 關鍵注意事項

1. **`v-file-input` 型別**：Vuetify 3 不加 `multiple` 時，v-model 型別為 `File | null`
2. **`eachCell({ includeEmpty: true })`**：必填，否則空白儲存格不加邊框
3. **`getRow()` vs `addRow()`**：模板填入用 `getRow(rowNumber)` 定址，`addRow()` 只能追加到末尾
4. **後端 Blob → Buffer**：`Buffer.from(await blob.arrayBuffer())`

---

## 驗證方式

1. 在 Excel 建立含公司版頭的 .xlsx，第 5 列起為空白資料區
2. 進入「模板管理」→ 上傳，名稱「測試模板」，資料起始列 5
3. 進入任一檢查表 → 預覽 → 匯出 → Excel
4. 確認出現「不使用模板」與「測試模板」兩個選項
5. 選「測試模板」→ 下載的 xlsx 第 1–4 列為版頭，第 5 列起為檢查資料
6. 選「不使用模板」→ 下載的 xlsx 為現有預設格式
7. 刪除模板後，匯出對話框仍正常（只顯示「不使用模板」）
