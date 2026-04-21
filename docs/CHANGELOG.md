# CHANGELOG.md

版本格式：`YYYY-MM-DD — 版本說明`

---

## 2026-04-21 — 計劃文件整理（Phase 1–4 歸檔 / Phase 5 新增）

- 將已完成的 `docs/plans/2026-04-16-自主檢查表系統.md` 以 `git mv` 搬移至 `docs/plans/archive/`，保留 git 歷史
- 新增 `docs/plans/2026-04-21-phase5-後端整合.md`：展開前端側的後端整合實作計劃
  - API contract 假設（REST 路由、錯誤格式 `{ error, code? }`）
  - 新檔：`src/services/http.ts`、`src/services/apiError.ts`；新增 `.env.development` / `.env.production`
  - `http.ts` 職責：base URL、JSON 解析、timeout（AbortController 10s）、error normalization、`getAuthToken()` 預留 hook、401 → `window.dispatchEvent('auth:unauthorized')`
  - `api.ts` 公開函式簽名鎖定不變（符合 `.claude/rules/api-design.md`），僅替換內部實作；`sanitizeXxxName` 保留作前置驗證
  - UI 配套：各 View 的 loading / 全域 snackbar 錯誤顯示；不做樂觀更新
  - 不含自動遷移 localStorage 舊資料；登入功能延後至 Phase 6（預留 hook / event）
- 更新 `docs/FEATURES.md`：Phase 5 區塊補上 plan 連結與規劃摘要

---

## 2026-04-21 — Phase 4 匯出功能（Excel / PDF / 列印）

- 新增 `src/composables/useExport.ts`：三個匯出函式 + 共用輔助
  - `exportToExcel`：`exceljs` 產生單一工作表（標題合併列、表頭底色 `#E3F2FD`、細框線、欄寬、文字換行、置頂對齊）
  - `exportToPdf`：A4 直式；lazy-load `/fonts/NotoSansTC-Regular.ttf` → base64 → `addFileToVFS` + `addFont` 註冊 `NotoSansTC`；字型結果 module-scope 快取避免重複下載；找不到字型時拋出含修復指引的錯誤
  - `exportToPrint`：呼叫 `window.print()`
  - 共用 `sanitizeFilename`（剝除 `\ / : * ? " < > |`）、`formatGauge`（`gaugeName` → 「（已刪除）」fallback）、`triggerDownload`（Blob → `<a>` click → `revokeObjectURL`）
- 新增 `src/components/ExportDialog.vue`：`v-dialog` + `v-list`，三種格式並列
  - 匯出中：該列顯示 `v-progress-circular`，對話框切換 `persistent` 防止誤關
  - 錯誤以 `v-alert` 內嵌顯示（例：PDF 字型檔缺失）
  - 「網頁列印」選擇後先關對話框、待下一幀再 `window.print()`，避免殘影混入列印內容
- 更新 `src/views/ChecklistPreviewView.vue`：
  - 「匯出」按鈕改為開啟 `ExportDialog`（先前為 Phase 4 placeholder 提示）
  - `:disabled` 綁 `!checklist`，避免載入未完成時觸發

---

## 2026-04-21 — Phase 3 語音輸入 + 預覽模式

- 新增 `src/composables/useSpeechRecognition.ts`：包裝 Web Speech API（`SpeechRecognition` / `webkitSpeechRecognition`），預設 `zh-TW`，暴露 `isSupported` / `isListening` / `toggle`；`onUnmounted` 自動停止
- 新增 `src/components/SpeechInputField.vue`：`v-text-field` 右側嵌入麥克風按鈕
  - 支援瀏覽器：按鈕在錄音中顯示紅色 `mic-pulse` CSS 動畫，辨識結果追加至現有文字後方（中間加空格）
  - 不支援瀏覽器：按鈕 disabled，以 `v-tooltip` 顯示「語音輸入僅支援 Chrome / Edge 瀏覽器」
- 更新 `src/components/ChecklistTable.vue`：檢驗項目 / 備註兩欄改用 `SpeechInputField`
- 新增 `src/views/ChecklistPreviewView.vue`：唯讀預覽頁，含返回 / 重新編輯 / 匯出按鈕（匯出功能留待 Phase 4）；量具欄若 `gaugeName` 為空但 `gaugeId` 存在則顯示「（已刪除）」；含 `@media print` 隱藏操作按鈕
- 更新 `src/router/index.ts`：`checklist-preview` 路由改用 `() => import(...)` 動態載入；移除 Phase 1/2 placeholder，only 保留獨立 `NotFoundView`
- 更新 `src/App.vue`：非 Chrome / Edge 瀏覽器於 `<v-main>` 頂部固定顯示 `v-alert` 提示；新增全域 `@media print` 隱藏 AppBar 與 `.no-print` 元素
- 更新 `src/shims.d.ts`：補上 `SpeechRecognition` / `SpeechRecognitionEvent` 等 Web Speech API 型別宣告（lib.dom 未內建）

---

## 2026-04-20 — Phase 2 核心頁面（檢查表列表 / 新增編輯 / 量具管理）

- 將 `src/services/api.ts` 所有公開函式改為 `async`，回傳 Promise，與 Phase 5 後端切換時簽名保持一致（符合 `.claude/rules/api-design.md`）
- 新增 `views/ChecklistListView.vue`：
  - 以 `v-data-table` 顯示檢查表列表，含序號 / 文件名稱 / 存檔時間 / 操作欄
  - 點擊列導向預覽頁，操作欄提供編輯、刪除按鈕
  - 刪除使用 `v-dialog` 二次確認
- 新增 `views/ChecklistEditView.vue`：
  - 新增（`/checklist/new`）與編輯（`/checklist/:id/edit`）共用同一元件
  - 文件名稱預設 `自主檢查表-YYYY-MM-DD`，可編輯，含 200 字元 counter
  - 儲存後導向預覽頁
- 新增 `components/ChecklistTable.vue`：圖面位置 / 量具 / 檢驗項目 / 備註四欄編輯表格，含新增列、刪除列。檢驗項目與備註的語音輸入功能留待 Phase 3 `SpeechInputField` 整合
- 新增 `components/GaugeSelect.vue`：`v-autocomplete` + 即時新增量具對話框，emit `gauge-created` 通知父層同步
- 新增 `views/GaugeManageView.vue`：量具列表 + 新增 / 刪除（含 `v-dialog` 確認對話框）
- `src/router/index.ts`：移除上述 View 的 placeholder，改用 `() => import(...)` 動態載入；預覽頁仍為 Phase 3 placeholder

---

## 2026-04-20 — Phase 1 基礎建設（Vuetify / Router / 型別 / API service）

- 更新 `src/main.ts`：掛載 Vuetify 3 與 vue-router
- 更新 `src/App.vue`：加入 `<v-app>` 外框、AppBar（含量具管理連結）、`<RouterView>`
- 新增 `src/plugins/vuetify.ts`：Vuetify 3 初始化（MDI 圖示、Light 主題、全域元件 defaults）
- 新增 `src/router/index.ts`：vue-router v4 History 模式，5 條路由含 not-found 補底；Phase 1 各 View 以 placeholder 佔位
- 新增 `src/types/index.ts`：
  - `ChecklistRow` / `Checklist` / `ChecklistSummary` / `Gauge` interface
  - `ChecklistInput` / `ChecklistUpdate` utility type
  - `ExportFormat` 聯合型別（`'excel' | 'pdf' | 'print'`）
- 新增 `src/services/api.ts`：以 localStorage 實作全部 8 支公開函式；含輸入驗證（trim、長度限制、重複名稱檢查）
- 新增 `src/shims.d.ts`：宣告 `vuetify/styles` 及 `@mdi/font/css/materialdesignicons.css` 模組，解決 TS2882 型別錯誤

---

## 2026-04-20 — 建立 ESLint / Prettier / pre-commit hook 及環境變數範本

- 安裝 ESLint 10 + Prettier 3，採用 Vue 官方 flat config（`eslint-plugin-vue` + `@vue/eslint-config-typescript` + `@vue/eslint-config-prettier`）
- 新增 `eslint.config.ts`、`.prettierrc.json`、`.prettierignore`
- `package.json` 新增 scripts：`lint`、`format`、`prepare`
- 安裝 husky v9 + lint-staged v16，在 `.husky/pre-commit` 執行 `lint-staged`；`package.json` 加入 `lint-staged` 設定：TS/Vue/JS 跑 `eslint --fix` + `prettier`，JSON/MD/CSS/HTML 跑 `prettier`
- 新增 `.env.example`（列出 `VITE_API_BASE_URL`）
- `.gitignore` 補上 `.env` / `.env.*` 規則（保留 `.env.example`）

> 注意：WSL 環境下 `.git/config` 被其他程式鎖定，`husky init` 未能寫入 `core.hooksPath`，需手動執行 `git config core.hooksPath .husky`（或重新跑 `npm install` 觸發 `prepare`）

---

## 2026-04-20 — 修正 `vite.config.ts` 型別錯誤

- 將 `defineConfig` import 來源由 `vite` 改為 `vitest/config`，使 `test` 欄位的型別能被正確識別，解決 `npm run build` 時 `vue-tsc` 回報 TS2769
- 於 `docs/TESTING.md` 新增「設定陷阱」章節，記錄症狀、原因與修正方式

---

## 2026-04-16 — 測試環境建立

- 安裝 Vitest v4、@vue/test-utils v2、jsdom、@vitest/coverage-v8
- 在 `vite.config.ts` 加入 `test` 區塊（jsdom 環境、globals 模式、v8 覆蓋率）
- 建立 `tests/setup.ts`：全域清空 localStorage、mock Web Speech API
- 建立 `tests/example.test.ts`：環境驗證測試（localStorage 隔離、Speech API mock 掛載）
- 新增 npm scripts：`test`、`test:run`、`test:coverage`

---

## 2026-04-16 — 專案初始化

- 以 `npm create vue@latest` 初始化 Vue 3 + TypeScript + Vite 專案
- 建立開發計畫文件 `docs/plans/2026-04-自主檢查表系統.md`
- 建立 CLAUDE.md 與完整 docs/ 文件結構
- 加入 `.claude/settings.json` 安全性設定

---

<!-- 往下新增版本條目，最新版本在最上方 -->
