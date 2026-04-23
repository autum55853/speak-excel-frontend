# FEATURES.md

功能完成狀態追蹤。狀態：✅ 完成 / 🚧 進行中 / ⏳ 待開發

---

## 檢查表管理

### 列表頁（ChecklistListView）✅

行為描述：

- 以 `v-data-table` 顯示所有已存檔的檢查表
- 欄位：序號（自動編號）| 文件名稱 | 存檔時間
- 按 `updatedAt` 降序排列
- 點擊列 → 導向 `/checklist/:id/preview`
- 右上角「新增文件」按鈕 → 導向 `/checklist/new`
- 空資料時顯示 `v-empty-state`（icon + 提示 + 新增按鈕）
- 左側 `v-navigation-drawer` 統一提供「檢查表列表 / 新增檢查表 / 量具管理」三個路由入口，手機版收合為漢堡按鈕

### 新增 / 編輯檢查表（ChecklistEditView）✅

行為描述：

- 頁首顯示標題（`text-h4`）與副標（依模式顯示「建立一份新的自主檢查表」或「修改現有檢查表內容」）；操作區靠右為「取消 / 儲存」
- 頂部文件名稱輸入框，預設值格式：`自主檢查表-YYYY-MM-DD`（當天日期）
- 表格欄位（每列）：
  - **圖面位置**（必填 *）：純文字輸入框（`maxlength="50"`）
  - **量具**（必填 *）：`GaugeSelect` 元件（`variant="underlined"` v-autocomplete 下拉 + 即時新增按鈕，含 tooltip）
  - **檢驗項目**（必填 *）：`SpeechInputField` 元件（`variant="underlined"` 文字框 + 麥克風按鈕含 tooltip）
  - **備註**：`SpeechInputField` 元件
  - 必填欄位標題含紅色 `*` 標示（`.must-item` class）
- 底部操作列：
  - 「新增一列」— 在表格末尾新增空白列
  - 「刪除選中列」— 刪除已勾選的列（操作前無需確認對話框，因列內容可復原）
- 「儲存」按鈕 → 呼叫 `api.createChecklist` 或 `api.updateChecklist` → 導向預覽頁

### 預覽模式（ChecklistPreviewView）✅

行為描述：

- 頁首含返回按鈕 + 標題「檢查表預覽」與副標「檢視文件內容並匯出為 Excel / PDF / 列印」；操作區靠右為「重新編輯 / 匯出」
- 唯讀表格，顯示完整檢查表內容（含文件名稱、建立 / 更新時間）
- 量具欄位顯示邏輯：`gaugeName` 正常顯示；若 `gaugeId` 仍存在但 `gaugeName` 為空，顯示「（已刪除）」
- 操作按鈕：
  - 「返回」→ 回到列表頁
  - 「重新編輯」→ 回到 `/checklist/:id/edit`
  - 「匯出」→ 開啟 `ExportDialog` 選擇匯出格式（Phase 4 完整實作，Phase 3 僅顯示提示）
- 含 `@media print` CSS：列印時自動隱藏操作按鈕

---

## 量具管理（GaugeManageView）✅

行為描述：

- 頁首顯示標題「量具管理」與副標「新增、刪除可供檢查表選用的量具」
- 頂部新增區：文字輸入框（`maxlength="50"`）+ 「新增」按鈕
  - 若名稱重複，顯示錯誤提示，不執行新增
- 資料表上方搜尋框：即時篩選量具名稱（綁定 `v-data-table :search`）
- `v-data-table` 顯示所有量具（欄位：量具名稱 | 建立時間 | 操作，操作欄置中對齊）
- 每列有「刪除」按鈕（含 tooltip），點擊後顯示確認對話框
  - 刪除後，已使用該量具的檢查表列，`gaugeId` 保留但 `gaugeName` 顯示為「（已刪除）」

---

## 語音輸入（SpeechInputField）✅

行為描述：

- 顯示方式：`variant="underlined"` 文字輸入框 + 右側麥克風圖示按鈕
- 點擊麥克風按鈕：開始錄音（按鈕變紅色脈衝動畫 `mic-pulse`）
- 辨識結果追加至輸入框現有文字後方（中間加空格）
- 再次點擊按鈕：停止錄音
- 若瀏覽器不支援 Speech API：麥克風按鈕 disabled，`v-tooltip` 顯示「語音輸入僅支援 Chrome / Edge 瀏覽器」
- 支援瀏覽器的麥克風按鈕同樣包在 `v-tooltip`，顯示「語音輸入」提示
- 頁面頂部固定顯示一條 `v-alert` 提示 banner（非 Chrome/Edge 才顯示；由 `App.vue` 統一輸出）
- 底層 composable：`useSpeechRecognition`（`zh-TW` 預設，`onUnmounted` 自動停止）

---

## 匯出功能（ExportDialog）✅

行為描述：

- 於預覽頁按「匯出」開啟 `ExportDialog`，對話框列出三種匯出格式：
  1. **Excel (.xlsx)**：`exceljs` 產生含標題列、表頭底色、邊框、欄寬、自動換行的試算表
  2. **PDF**：`jspdf` + `jspdf-autotable` 產生 A4 直式 PDF，含中文字型（Noto Sans TC）
  3. **網頁列印**：呼叫 `window.print()`，透過 `@media print` CSS 隱藏 AppBar / 操作按鈕 / Dialog overlay
- 選擇後立即觸發對應動作；匯出中列項顯示 `v-progress-circular`，對話框進入 `persistent` 模式避免誤關
- 錯誤訊息以 `v-alert` 顯示於對話框內（例：PDF 字型網路下載失敗）
- 檔名格式：`<文件名稱>.xlsx` / `<文件名稱>.pdf`，去除檔名非法字元 `\ / : * ? " < > |`
- 網頁列印「另存為 PDF」時，瀏覽器預設檔名取自 `document.title`（載入預覽頁時自動設為文件名稱）

### 程式碼切割（Code Splitting）

- `exceljs`（~929 kB）、`jspdf`（~399 kB）、`jspdf-autotable`（~29 kB）均以動態 `import()` 載入
- Vite 自動切成獨立 chunk；預覽頁首屏不下載匯出函式庫，使用者點擊對應格式才觸發 chunk 請求

### PDF 中文字型

- 字型從 jsDelivr CDN 動態下載 `NotoSansTC_400Regular.ttf`（`@expo-google-fonts/noto-sans-tc@0.4.3`，完整 TTF，約 6.78MB）
- 以 module scope `cachedFontBase64` 快取，同一 session 僅下載一次；瀏覽器 HTTP 快取後重複使用零延遲
- 離線或 CDN 不可達時，`ExportDialog` 顯示明確錯誤訊息，引導改用「網頁列印」另存 PDF

---

## 後端整合（Phase 5）🚧

前端唯一需要變動的是 `src/services/api.ts`：將 localStorage 實作替換為 HTTP fetch 呼叫。
後端 API 基底 URL 從環境變數 `VITE_API_BASE_URL` 讀取，所有頁面元件無需修改。

詳細實作計劃：[`docs/plans/2026-04-21-phase5-後端整合.md`](./plans/2026-04-21-phase5-後端整合.md)

### 已完成（Steps 1 & 2）

- ✅ `src/services/apiError.ts` — `ApiError` class（含 `status`、`message`）
- ✅ `src/services/http.ts` — fetch wrapper（base URL / 10s timeout / error normalization / auth 預留 / 401 event）
- ✅ `src/services/api.ts` — 完整改寫：移除 localStorage、加入 snake_case↔camelCase mapping、`gaugeName` 前端 join、PUT 全量替換、204 re-fetch

### 待完成

- ⏳ Step 3：檢查各 View loading / error 狀態；`App.vue` 全域 snackbar 訂閱錯誤事件
- ⏳ Step 4：更新 `DEVELOPMENT.md` 後端啟動說明、`FEATURES.md` / `CHANGELOG.md`
- ⏳ Step 5：端對端手動驗證（完整 CRUD 流程、離線錯誤訊息）

### 環境變數

| 變數 | 值 |
|------|-----|
| `VITE_API_BASE_URL` | `http://localhost:3000/api`（開發） |
| `VITE_YATING_API_KEY` | 雅婷語音辨識 API Key |

登入功能不在本階段實作，但 http 層已預留 `Authorization` 注入與 401 事件分派，供 Phase 6 接入。
