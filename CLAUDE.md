# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**speak-excel** — CNC 工廠機台自主檢查表 Web App  
Vue 3 + TypeScript + Vite 前端；後端為獨立專案 speak-excel-api（Express + Supabase）

## 常用指令

```bash
npm run dev             # 啟動開發伺服器（Vite）
npm run build           # TypeScript 型別檢查 + Vite 打包
npm run preview         # 預覽打包結果
npm run test            # 執行 Vitest（watch 模式）
npm run test:run        # 執行 Vitest（單次，CI 用）
npm run test:coverage   # 產生覆蓋率報告（v8，輸出至 coverage/）
npm run lint            # ESLint 檢查並自動修正
npm run format          # Prettier 格式化 src/ 與 tests/
```

## 架構

### 資料流

```
View (.vue) → src/services/api.ts → src/services/http.ts → speak-excel-api
```

- **`http.ts`**：底層 fetch 封裝，負責逾時（10s）、Authorization header、HTTP 錯誤統一轉為 `ApiError`，401 時 dispatch `auth:unauthorized` 自訂事件
- **`api.ts`**：唯一可存取資料的模組。處理後端 snake_case ↔ 前端 camelCase 雙向轉換（`mapChecklist`、`mapGauge`、`mapTemplate`、`serializeRows`），也包含前端輸入驗證（`sanitize*` 函式）。View 元件與 composables 禁止直接使用 `fetch` 或 `localStorage`

### 匯出架構（`src/composables/useExport.ts`）

三種匯出格式皆由 `ExportDialog.vue` 統一觸發，View 元件不直接呼叫匯出邏輯：

- **Excel**：`exceljs`，支援無模板（預設樣式）與有模板（填入 `dataStartRow` 起始列）兩種模式
- **PDF**：`jspdf` + `jspdf-autotable`；中文字型（Noto Sans TC）從 jsDelivr CDN 動態取得並快取在模組層級的 `cachedFontBase64` 變數，同一 session 只下載一次
- **列印**：`window.print()`；列印時的版面由 `printTemplateData`（模組層級 `ref<PrintTemplateData | null>`）控制，`ExportDialog` 寫入、`ChecklistPreviewView` 讀取並在 `@media print` 渲染

`exceljs`、`jspdf`、`jspdf-autotable` 均為動態 import（點擊時才載入），避免首屏下載 ~3MB 套件。

### 路由結構

| 路徑 | 名稱 | View |
|------|------|------|
| `/` | `checklist-list` | `ChecklistListView` |
| `/checklist/new` | `checklist-new` | `ChecklistEditView` |
| `/checklist/:id/edit` | `checklist-edit` | `ChecklistEditView` |
| `/checklist/:id/preview` | `checklist-preview` | `ChecklistPreviewView` |
| `/gauges` | `gauges` | `GaugeManageView` |
| `/templates` | `templates` | `TemplateManageView` |

### UI 框架

Vuetify 3 透過 `vite-plugin-vuetify` **自動匯入**所有元件，無需手動 import。圖示使用 `@mdi/font`。

## 環境變數

| 變數 | 說明 |
|------|------|
| `VITE_API_BASE_URL` | 後端 API 基底 URL（必填，`http.ts` 啟動時若未設定會 throw） |
| `VITE_BASE` | Vite base path（選填，預設 `/`，GitHub Pages 部署時使用） |

## 關鍵規則

- 語音輸入使用 Web Speech API，僅支援 Chrome / Edge，需在 UI 顯示提示
- 功能開發請先建立 `docs/plans/YYYY-MM-DD-<feature>.md`；完成後移至 `docs/plans/archive/`
- 新增 View 須同步更新 `src/router/index.ts` 及 `docs/FEATURES.md`
- 所有 Vue 元件使用 `<script setup lang="ts">` 語法
- 型別定義集中在 `src/types/index.ts`，禁止在元件內散落 interface
- 量具（Gauge）與檢查表（Checklist）的 ID 一律使用 UUID 字串格式
- 刪除操作必須顯示確認對話框，禁止直接刪除

## 詳細文件

- `./docs/ARCHITECTURE.md` — 架構、目錄結構、資料流、DB Schema
- `./docs/DEVELOPMENT.md` — 開發規範、命名規則
- `./docs/FEATURES.md` — 功能列表與完成狀態
- `./docs/CHANGELOG.md` — 更新日誌
