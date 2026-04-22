# CHANGELOG.md

版本格式：`YYYY-MM-DD — 版本說明`

---

## 2026-04-22 — 匯出功能優化（動態 import / CDN 字型 / 列印殘影 / 檔名）

- `src/composables/useExport.ts`：
  - **Excel 卡頓修正**：`import ExcelJS from 'exceljs'` 由頂層靜態 import 改為 `buildExcelBlob` 內的動態 `await import('exceljs')`，Vite 自動切成獨立 chunk（929 kB），預覽頁首屏不再下載匯出函式庫
  - `buildPdfDoc` 內同樣改為 `Promise.all([import('jspdf'), import('jspdf-autotable'), loadPdfFont()])` 並行動態載入
  - **PDF 字型修正**：字型來源由不存在的 `public/fonts/NotoSansTC-Regular.ttf` 改為 jsDelivr CDN（`NotoSansTC-Regular.ttf` 完整 TTF）；以 `cachedFontBase64`（module scope）快取 base64，同一 session 僅下載一次；離線時顯示明確錯誤訊息並引導改用「列印」
  - TypeScript 頂層保留 `import type { jsPDF }` 供型別推斷
- `src/views/ChecklistPreviewView.vue`：
  - **列印另存 PDF 檔名修正**：`load()` 成功後設定 `document.title = \`\${data.name} - 自主檢查表\``，使瀏覽器「另存為 PDF」對話框預設帶入文件名稱
  - `onUnmounted` 還原 `document.title = '自主檢查表系統'`
- `src/components/ExportDialog.vue`：
  - **列印殘影修正（時序）**：「網頁列印」分支關閉 Dialog 後，等待從單一 `requestAnimationFrame`（< 16ms）改為 `setTimeout(resolve, 300)`（Vuetify Dialog 淡出動畫約 225ms），確保 DOM 完全離場後再呼叫 `window.print()`
- `src/App.vue`：
  - **列印殘影修正（CSS）**：非 scoped `@media print` 追加 `.v-overlay-container { display: none !important }`，覆蓋 Vuetify `v-dialog` teleport 至 `<body>` 的 overlay 容器，雙重保險防止殘影
- 計畫文件：`docs/plans/archive/2026-04-22-export-優化.md`

---

## 2026-04-22 — UI 細節優化（必填標示 / Tooltip / 量具搜尋 / 樣式統一）

- `ChecklistTable.vue`：
  - 必填欄位（圖面位置、量具、檢驗項目）標題加紅色 `*` 標示（`.must-item` CSS class），取代原本各欄位下方 `hint="必填"` / `persistent-hint`
  - 「新增量具」按鈕加 `v-tooltip`，提示文字「新增量具」
  - 圖面位置 `maxlength` 由 100 改為 50；移除各欄 `hint` / `persistent-hint`，以 `hide-details` 簡化佈局
  - 調整欄寬：index 欄 48 → 20px、action 欄 96 → 50px、position 欄 140 → 120px、gauge 欄 240 → 200px
  - 移除 `tbody td` 的 `vertical-align` / `padding` 樣式（改由 `ChecklistPreviewView` 側管理）
- `SpeechInputField.vue`：
  - 改用 `variant="underlined"` 樣式，與 GaugeSelect 視覺一致
  - 麥克風按鈕加 `v-tooltip`（文字「語音輸入」）；固定 `hide-details`（移除依 hint 決定是否顯示底部說明的邏輯）
  - 移除 `.speech-input-field :deep(.v-field__append-inner)` scoped CSS
- `GaugeSelect.vue`：
  - 改用 `variant="underlined"` 樣式；移除 `clearable` 屬性
- `ChecklistListView.vue`：
  - 操作欄對齊由 `end` 改為 `center`
  - 編輯 / 刪除按鈕分別加 `v-tooltip`（文字「編輯」 / 「刪除此列」）
- `ChecklistPreviewView.vue`：
  - 表格 `td` 改為 `vertical-align: middle`，並補 `padding-top/bottom: 8px`
- `GaugeManageView.vue`：
  - 操作欄對齊由 `end` 改為 `center`；新增量具名稱輸入框 `maxlength` 由 100 改為 50
  - 新增搜尋框（`v-model="search"` 綁 `v-data-table :search`），支援量具名稱即時篩選
  - 按鈕欄 RWD 斷點調整：`md="2"` → `md="1"`
- 刪除 `src/components/HelloWorld.vue`（Vite starter template 殘留元件）

---

## 2026-04-22 — 排版與 RWD 規範對齊

- `.claude/rules/frontend.md` 新增「排版與 RWD 規範」：頁面切版一律使用 Vuetify Grid System（`<v-row>` / `<v-col>`），`<v-col>` 必須明確標註 `cols` / `md` / `lg` 等 RWD 斷點
- 四個 View 頁面層級的 `d-flex` 區塊改寫為 `v-row` + `v-col`：
  - `ChecklistListView.vue`：頁首（標題 vs. 「新增文件」按鈕）→ `cols="12" md="8"` + `cols="12" md="4"`，手機堆疊、桌機左右分欄
  - `ChecklistEditView.vue`：頁首（標題 vs. 取消 / 儲存按鈕）同上
  - `ChecklistPreviewView.vue`：頁首（返回 + 標題 vs. 重新編輯 / 匯出）→ `md="7"` + `md="5"`；文件資訊列（文件名稱 vs. 建立 / 更新時間）→ `md="8"` + `md="4"`
  - `GaugeManageView.vue`：頁首 → 單欄 `cols="12"`；新增量具區塊（輸入框 vs. 新增按鈕）→ `cols="12" sm="9" md="10"` + `cols="12" sm="3" md="2"`，按鈕加 `block` 在手機版撐滿寬度
- 元件內部微布局（表格 th 內的按鈕、`SpeechInputField` 的 `append-inner`、`GaugeSelect` 的 wrapper）維持 `d-flex`，不強制改 Grid
- 文件更新：
  - `docs/DEVELOPMENT.md` 新增「Layout / RWD 規範」章節，載明 Grid 使用原則與 `d-flex` 例外
  - `docs/plans/2026-04-21-phase5-後端整合.md` Step 3 追加 layout 對齊條目，供後續新增 UI 時沿用

---

## 2026-04-21 — UI / Navigation 優化

- `src/style.css` 清除 Vite starter template 殘留樣式（`#app` 寬度限制、`:root` 強制深色、`.hero` / `#next-steps` / `#docs` 等），只保留 `html/body` reset、`#app { min-height: 100vh }` 與 `@media print .no-print` 規則。先前頁面黑底、元件擠在同一行的根因
- `src/plugins/vuetify.ts`：
  - primary 由 `#1976D2` 調為工業感深藍 `#1E3A8A`；`secondary` / `accent` / `error` / `info` / `success` / `warning` 色票同步換成 Tailwind slate / sky / red / blue / green / amber 等級；補齊 `background` (`#F8FAFC`) 與 `surface` (`#FFFFFF`)
  - 改為顯式 `import * as components` / `import * as directives` 並在 `createVuetify` 註冊，避免 tree-shaking 後元件缺失
  - 全域 defaults 新增 `VCard` 圓角 (`rounded: 'lg'`) 與 `VAppBar` flat
- `src/App.vue` 重寫導覽結構：
  - 新增 `v-navigation-drawer`：桌機常駐、手機 temporary（以 `useDisplay().mobile` 切換）；主選單含「檢查表列表 / 新增檢查表 / 量具管理」
  - `v-app-bar` 加入 nav icon 切換 drawer、標題加 `mdi-clipboard-check-outline` icon
  - drawer append 區顯示產品名稱與版本資訊
  - `@media print` 同步隱藏 `v-navigation-drawer` 與 `.no-print`，並清除 `v-main` / `v-container` 列印時的 padding
- 各 View 標題統一為 `text-h4 font-weight-medium` + 副標（`text-body-2 text-medium-emphasis`），提升視覺層次
- `ChecklistListView`：空資料改用 `v-empty-state` 取代 `no-data-text`，含 icon、描述、新增按鈕 CTA
- 依賴與建置設定：
  - `package.json` 新增 `vite-plugin-vuetify`（autoImport）與 `sass` / `sass-embedded` / `sass-loader`（Vuetify SCSS 編譯）
  - `vite.config.ts` 載入 `vite-plugin-vuetify({ autoImport: true })`
  - `src/main.ts` 補上 `import 'vuetify/styles'` 確保 SSR-like 情境（Vitest / preview）也能載入樣式
- 靜態資源與 HTML：
  - `index.html` 標題改為「自主檢查表系統」；favicon 從 `favicon.svg` 換成 `favicon.ico`
  - 新增 `public/favicon.ico`、`src/assets/favicon.ico`、`src/assets/apple-touch-icon.png`
  - 移除 Vite starter 遺留資產：`public/favicon.svg`、`public/icons.svg`、`src/assets/hero.png`、`src/assets/vite.svg`、`src/assets/vue.svg`
- 註：沿用 light 主題，不再依賴 `prefers-color-scheme`（原 starter css 會強制轉深色，與 Vuetify 主題衝突）

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
