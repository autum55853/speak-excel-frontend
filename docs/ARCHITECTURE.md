# ARCHITECTURE.md

## 整體架構

```
瀏覽器（Vue 3 SPA）
    │
    ├── src/services/api.ts   ← Phase 5 已切換：HTTP 呼叫後端 API
    │       ├── src/services/http.ts      # fetch wrapper（timeout / 錯誤處理）
    │       └── src/services/apiError.ts  # ApiError 型別
    │
    └── speak-excel-api（獨立專案）
            └── Express + Supabase PostgreSQL
```

前端與後端**完全分離**，透過 `src/services/api.ts` 統一管理 API 呼叫。  
Phase 5 已完成後端整合，api.ts 改為 HTTP fetch 呼叫 `speak-excel-api`；頁面元件簽名不變。

---

## 目錄結構

```
speak-excel/
├── index.html                   # Vite HTML 進入點（title、favicon）
├── vite.config.ts               # Vite 設定（亦含 Vitest test 區塊、vite-plugin-vuetify）
├── tsconfig.json                # TypeScript 根設定（引用其他 tsconfig）
├── tsconfig.app.json            # 前端程式碼的 TS 設定
├── tsconfig.node.json           # Vite config 的 TS 設定
├── tsconfig.test.json           # Vitest 測試的 TS 設定
├── package.json
├── src/
│   ├── main.ts                  # 應用程式進入點，掛載 Vue + Vuetify + Router
│   ├── App.vue                  # 根元件，含 AppBar、NavigationDrawer 與 <RouterView>
│   ├── shims.d.ts               # CSS 側效 import 的 TS 模組宣告（vuetify/styles 等）
│   ├── style.css                # 全域樣式（reset + `@media print` .no-print）
│   ├── assets/                  # 應用內資源（favicon、apple-touch-icon 等）
│   ├── plugins/
│   │   └── vuetify.ts           # Vuetify 3 初始化（主題、MDI 圖示、元件 defaults、components/directives 註冊）
│   ├── router/
│   │   └── index.ts             # vue-router v4 History 模式路由設定
│   ├── types/
│   │   └── index.ts             # 所有 TypeScript interface / type 定義
│   ├── services/
│   │   └── api.ts               # API service layer（async，localStorage / 未來 HTTP）
│   ├── composables/
│   │   ├── useSpeechRecognition.ts  # ✅ 語音輸入 composable
│   │   └── useExport.ts             # ✅ 匯出功能 composable
│   ├── views/                   # 頁面元件（對應路由）
│   │   ├── ChecklistListView.vue    # ✅ 首頁：檢查表列表
│   │   ├── ChecklistEditView.vue    # ✅ 新增 / 編輯檢查表
│   │   ├── ChecklistPreviewView.vue # ✅ 預覽模式
│   │   └── GaugeManageView.vue      # ✅ 量具管理
│   └── components/              # 可複用 UI 元件
│       ├── ChecklistTable.vue       # ✅ 檢查表表格（編輯用）
│       ├── SpeechInputField.vue     # ✅ 文字框 + 麥克風按鈕
│       ├── GaugeSelect.vue          # ✅ 量具下拉選單（含即時新增）
│       └── ExportDialog.vue         # ✅ 匯出格式選擇對話框
├── docs/
│   ├── plans/                   # 進行中開發計畫
│   └── plans/archive/           # 已完成計畫歸檔
├── tests/                       # Vitest 測試
└── public/                      # 靜態資源（favicon.ico、fonts/ 中文字型等）
```

---

## 路由規劃

| 路徑                     | 元件                   | 說明                                   |
| ------------------------ | ---------------------- | -------------------------------------- |
| `/`                      | `ChecklistListView`    | 首頁：已存檔檢查表列表，按存檔時間降序 |
| `/checklist/new`         | `ChecklistEditView`    | 新增檢查表                             |
| `/checklist/:id/edit`    | `ChecklistEditView`    | 編輯已存在的檢查表                     |
| `/checklist/:id/preview` | `ChecklistPreviewView` | 預覽模式（唯讀）                       |
| `/gauges`                | `GaugeManageView`      | 量具管理                               |

路由設定集中在 `src/router/index.ts`，使用 vue-router v4 History 模式。

---

## TypeScript 型別定義（`src/types/index.ts`）

```typescript
interface ChecklistRow {
  id: string // UUID
  position: string // 圖面位置（編號）
  gaugeId: string // 量具 ID（UUID，對應 Gauge.id）
  gaugeName: string // 量具名稱（顯示用快取）
  inspectionItem: string // 檢驗項目
  remark: string // 備註
}

interface Checklist {
  id: string // UUID
  name: string // 文件名稱，預設格式：自主檢查表-YYYY-MM-DD
  rows: ChecklistRow[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

// 列表頁使用的輕量摘要，不含 rows
interface ChecklistSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface Gauge {
  id: string // UUID
  name: string // 量具名稱（唯一）
  createdAt: string // ISO 8601
}

// 建立檢查表時的輸入型別（無 id / timestamps）
type ChecklistInput = Omit<Checklist, 'id' | 'createdAt' | 'updatedAt'>

// 更新檢查表時允許修改的欄位
type ChecklistUpdate = Partial<Pick<Checklist, 'name' | 'rows'>>

// 匯出格式
type ExportFormat = 'excel' | 'pdf' | 'print'
```

---

## API Service Layer（`src/services/api.ts`）

所有頁面/元件透過此模組存取資料，禁止直接操作 localStorage 或 fetch。

**目前實作**：HTTP 呼叫 `speak-excel-api`（Phase 5 已完成切換）  
**底層**：`http.ts` 封裝 fetch（timeout 10s、`ApiError` 統一錯誤型別）  
**所有函式均為 async**，回傳 Promise，公開簽名與 localStorage 版本相同  
**snake_case 轉換**：此層負責後端 snake_case ↔ 前端 camelCase 雙向對應  
**gaugeName**：透過後端 PostgREST embedded join（`checklist_rows(*, gauges(name))`）取得，不需另外呼叫 `/gauges`

| 函式                        | 回傳型別                      | 說明                                               |
| --------------------------- | ----------------------------- | -------------------------------------------------- |
| `getChecklists()`           | `Promise<ChecklistSummary[]>` | 取得所有檢查表摘要（不含 rows），按 updatedAt 降序 |
| `getChecklist(id)`          | `Promise<Checklist \| null>`  | 取得單一檢查表（含 rows）                          |
| `createChecklist(data)`     | `Promise<Checklist>`          | 新增檢查表（含輸入驗證）                           |
| `updateChecklist(id, data)` | `Promise<Checklist>`          | 更新名稱或 rows                                    |
| `deleteChecklist(id)`       | `Promise<void>`               | 刪除檢查表                                         |
| `getGauges()`               | `Promise<Gauge[]>`            | 取得所有量具，按名稱排序                           |
| `createGauge(name)`         | `Promise<Gauge>`              | 新增量具（含重複名稱檢查）                         |
| `deleteGauge(id)`           | `Promise<void>`               | 刪除量具                                           |

---

## 語音輸入架構（`src/composables/useSpeechRecognition.ts`）

- 使用原生 `window.SpeechRecognition` / `window.webkitSpeechRecognition`
- 語言設定：`zh-TW`
- 辨識結果**追加**至現有文字後方（非覆蓋）
- 僅支援 Chrome / Edge，其他瀏覽器顯示提示訊息但不拋出錯誤

---

## 匯出架構（`src/composables/useExport.ts`）

| 格式          | 套件                        | 說明                                                                |
| ------------- | --------------------------- | ------------------------------------------------------------------- |
| Excel (.xlsx) | `exceljs`                   | 單一工作表；含標題列、表頭底色、邊框、欄寬、自動換行                |
| PDF           | `jspdf` + `jspdf-autotable` | A4 直式；透過 `addFileToVFS` + `addFont` 嵌入 Noto Sans TC 中文字型 |
| 網頁列印      | `window.print()`            | 搭配 `@media print` CSS，隱藏 AppBar 與 `.no-print` 元素            |

匯出入口統一由 `ExportDialog.vue` 呼叫，`ChecklistPreviewView` 之外的 View 不直接 import `useExport`。

### PDF 中文字型載入流程

1. `useExport` 首次呼叫 `exportToPdf` 時 `fetch('/fonts/NotoSansTC-Regular.ttf')`
2. 取得 `ArrayBuffer` 後分塊轉 base64（避免大檔 `String.fromCharCode(...bytes)` 堆疊溢位）
3. 結果快取於 module-scope 變數，同一頁 session 不重複下載
4. `doc.addFileToVFS()` 寫入 VFS → `doc.addFont()` 註冊 → `autoTable` 以此字型渲染表頭與內文

> 字型檔未部署時，會拋出含明確修復指引的錯誤（`ExportDialog` 會以 `v-alert` 顯示，引導使用者改用「網頁列印」）。
