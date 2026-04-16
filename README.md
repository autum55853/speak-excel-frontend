# speak-excel

CNC 工廠機台**自主檢查表**生成系統。行政人員可透過 Web 介面建立、編輯、預覽、存檔檢查表，並匯出為 Excel / PDF 或直接列印。

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | Vue 3 + `<script setup lang="ts">` |
| 語言 | TypeScript |
| 打包工具 | Vite |
| UI 框架 | Vuetify v3 |
| 路由 | vue-router v4 |
| Excel 匯出 | xlsx（SheetJS） |
| PDF 匯出 | jspdf + jspdf-autotable |
| 語音輸入 | Web Speech API（Chrome / Edge） |
| 後端 | 獨立專案 speak-excel-api（Express + Supabase） |

> **注意**：語音輸入僅支援 Chrome / Edge 瀏覽器；其他瀏覽器將降級為純文字輸入。

## 快速開始

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器（預設 http://localhost:5173）
npm run dev

# 3. 打包正式版
npm run build

# 4. 預覽打包結果
npm run preview
```

## 常用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動 Vite 開發伺服器，支援 HMR |
| `npm run build` | `vue-tsc -b` 型別檢查 + `vite build` 打包 |
| `npm run preview` | 本機預覽 dist/ 打包結果 |

## 路由結構

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | `ChecklistListView` | 首頁：已存檔檢查表列表 |
| `/checklist/new` | `ChecklistEditView` | 新增檢查表 |
| `/checklist/:id/edit` | `ChecklistEditView` | 編輯已存在的檢查表 |
| `/checklist/:id/preview` | `ChecklistPreviewView` | 預覽模式（唯讀） |
| `/gauges` | `GaugeManageView` | 量具管理 |

## 資料儲存

目前以 **localStorage** 模擬 API（key: `checklists`、`gauges`）。  
後端整合時，僅需修改 `src/services/api.ts` 的實作，所有頁面元件無需變動。  
後端 API 基底 URL 透過環境變數 `VITE_API_BASE_URL` 設定。

## 專案結構

```
src/
├── main.ts                  # 應用程式進入點
├── App.vue                  # 根元件
├── plugins/vuetify.ts       # Vuetify 初始化
├── router/index.ts          # 路由設定
├── types/index.ts           # 所有 TypeScript interface
├── services/api.ts          # API service layer
├── composables/
│   ├── useSpeechRecognition.ts
│   └── useExport.ts
├── views/                   # 頁面元件
└── components/              # 可複用 UI 元件
```

## 文件索引

| 文件 | 說明 |
|------|------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 架構、目錄結構、路由、資料流、DB Schema |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | 開發規範、命名規則、新增模組步驟、環境變數 |
| [docs/FEATURES.md](./docs/FEATURES.md) | 功能清單與完成狀態 |
| [docs/TESTING.md](./docs/TESTING.md) | 測試規範與指南 |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | 更新日誌 |
| [docs/plans/](./docs/plans/) | 進行中的開發計畫 |
| [docs/plans/archive/](./docs/plans/archive/) | 已完成的開發計畫 |
