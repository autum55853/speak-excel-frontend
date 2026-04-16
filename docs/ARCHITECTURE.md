# ARCHITECTURE.md

## 整體架構

```
瀏覽器（Vue 3 SPA）
    │
    ├── src/services/api.ts   ← 目前：localStorage 模擬
    │                            未來：HTTP 呼叫後端 API
    │
    └── speak-excel-api（獨立專案）
            └── Express + Supabase PostgreSQL
```

前端與後端**完全分離**，透過 `src/services/api.ts` 統一管理 API 呼叫。  
Phase 1-4（前端）開發期間，api.ts 以 localStorage 模擬後端；Phase 5 後端完成後直接替換實作，頁面元件無需修改。

---

## 目錄結構

```
speak-excel/
├── index.html                   # Vite HTML 進入點
├── vite.config.ts               # Vite 設定
├── tsconfig.json                # TypeScript 根設定（引用其他 tsconfig）
├── tsconfig.app.json            # 前端程式碼的 TS 設定
├── tsconfig.node.json           # Vite config 的 TS 設定
├── package.json
├── src/
│   ├── main.ts                  # 應用程式進入點，掛載 Vue + Vuetify + Router
│   ├── App.vue                  # 根元件，包含 <router-view>
│   ├── style.css                # 全域樣式
│   ├── plugins/
│   │   └── vuetify.ts           # Vuetify 初始化設定（主題、圖示）
│   ├── router/
│   │   └── index.ts             # vue-router 路由設定
│   ├── types/
│   │   └── index.ts             # 所有 TypeScript interface 定義
│   ├── services/
│   │   └── api.ts               # API service layer（localStorage / HTTP）
│   ├── composables/
│   │   ├── useSpeechRecognition.ts  # 語音輸入 composable
│   │   └── useExport.ts             # 匯出功能 composable
│   ├── views/                   # 頁面元件（對應路由）
│   │   ├── ChecklistListView.vue    # 首頁：檢查表列表
│   │   ├── ChecklistEditView.vue    # 新增 / 編輯檢查表
│   │   ├── ChecklistPreviewView.vue # 預覽模式
│   │   └── GaugeManageView.vue      # 量具管理
│   └── components/              # 可複用 UI 元件
│       ├── ChecklistTable.vue       # 檢查表表格（編輯用）
│       ├── ChecklistPreview.vue     # 檢查表表格（唯讀）
│       ├── SpeechInputField.vue     # 文字框 + 麥克風按鈕
│       ├── GaugeSelect.vue          # 量具下拉選單（含即時新增）
│       └── ExportDialog.vue         # 匯出格式選擇對話框
├── docs/
│   ├── plans/                   # 進行中開發計畫
│   └── plans/archive/           # 已完成計畫歸檔
└── public/                      # 靜態資源
```

---

## 路由規劃

| 路徑 | 元件 | 說明 |
|------|------|------|
| `/` | `ChecklistListView` | 首頁：已存檔檢查表列表，按存檔時間降序 |
| `/checklist/new` | `ChecklistEditView` | 新增檢查表 |
| `/checklist/:id/edit` | `ChecklistEditView` | 編輯已存在的檢查表 |
| `/checklist/:id/preview` | `ChecklistPreviewView` | 預覽模式（唯讀） |
| `/gauges` | `GaugeManageView` | 量具管理 |

路由設定集中在 `src/router/index.ts`，使用 vue-router v4 History 模式。

---

## TypeScript 型別定義（`src/types/index.ts`）

```typescript
interface ChecklistRow {
  id: string          // UUID
  position: string    // 圖面位置（編號）
  gaugeId: string     // 量具 ID（UUID，對應 Gauge.id）
  gaugeName: string   // 量具名稱（顯示用快取）
  inspectionItem: string  // 檢驗項目
  remark: string      // 備註
}

interface Checklist {
  id: string          // UUID
  name: string        // 文件名稱，預設格式：自主檢查表-YYYY-MM-DD
  rows: ChecklistRow[]
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
}

interface Gauge {
  id: string          // UUID
  name: string        // 量具名稱（唯一）
  createdAt: string   // ISO 8601
}
```

---

## API Service Layer（`src/services/api.ts`）

所有頁面/元件透過此模組存取資料，禁止直接操作 localStorage 或 fetch。

**目前實作**：以 localStorage 模擬（key: `checklists`、`gauges`）  
**切換至後端**：只需修改 api.ts 的函式實作，頁面元件無需變動

| 函式 | 說明 |
|------|------|
| `getChecklists()` | 取得所有檢查表（列表，不含 rows） |
| `getChecklist(id)` | 取得單一檢查表（含 rows） |
| `createChecklist(data)` | 新增檢查表 |
| `updateChecklist(id, data)` | 更新檢查表 |
| `deleteChecklist(id)` | 刪除檢查表 |
| `getGauges()` | 取得所有量具 |
| `createGauge(name)` | 新增量具 |
| `deleteGauge(id)` | 刪除量具 |

---

## 語音輸入架構（`src/composables/useSpeechRecognition.ts`）

- 使用原生 `window.SpeechRecognition` / `window.webkitSpeechRecognition`
- 語言設定：`zh-TW`
- 辨識結果**追加**至現有文字後方（非覆蓋）
- 僅支援 Chrome / Edge，其他瀏覽器顯示提示訊息但不拋出錯誤

---

## 匯出架構（`src/composables/useExport.ts`）

| 格式 | 套件 | 說明 |
|------|------|------|
| Excel (.xlsx) | `exceljs` | 生成含表頭的試算表 |
| PDF | `jspdf` + `jspdf-autotable` | 含中文表格的 PDF，需嵌入字型 |
| 網頁列印 | `window.print()` | 搭配 `@media print` CSS，隱藏操作按鈕 |

匯出入口統一由 `ExportDialog.vue` 呼叫，使用者選擇格式後觸發對應的 composable 函式。
