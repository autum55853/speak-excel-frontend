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
- AppBar 提供「量具管理」入口 → 導向 `/gauges`

### 新增 / 編輯檢查表（ChecklistEditView）✅

行為描述：

- 頂部文件名稱輸入框，預設值格式：`自主檢查表-YYYY-MM-DD`（當天日期）
- 表格欄位（每列）：
  - **圖面位置**：純文字輸入框
  - **量具**：`GaugeSelect` 元件（v-autocomplete 下拉 + 即時新增按鈕）
  - **檢驗項目**：`SpeechInputField` 元件（文字框 + 麥克風按鈕）
  - **備註**：`SpeechInputField` 元件
- 底部操作列：
  - 「新增一列」— 在表格末尾新增空白列
  - 「刪除選中列」— 刪除已勾選的列（操作前無需確認對話框，因列內容可復原）
- 「儲存」按鈕 → 呼叫 `api.createChecklist` 或 `api.updateChecklist` → 導向預覽頁

### 預覽模式（ChecklistPreviewView）✅

行為描述：

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

- `v-data-table` 顯示所有量具（欄位：量具名稱 | 建立時間）
- 頂部新增區：文字輸入框 + 「新增」按鈕
  - 若名稱重複，顯示錯誤提示，不執行新增
- 每列有「刪除」按鈕，點擊後顯示確認對話框
  - 刪除後，已使用該量具的檢查表列，`gaugeId` 保留但 `gaugeName` 顯示為「（已刪除）」

---

## 語音輸入（SpeechInputField）✅

行為描述：

- 顯示方式：一般文字輸入框 + 右側麥克風圖示按鈕
- 點擊麥克風按鈕：開始錄音（按鈕變紅色脈衝動畫 `mic-pulse`）
- 辨識結果追加至輸入框現有文字後方（中間加空格）
- 再次點擊按鈕：停止錄音
- 若瀏覽器不支援 Speech API：麥克風按鈕 disabled，`v-tooltip` 顯示「語音輸入僅支援 Chrome / Edge 瀏覽器」
- 頁面頂部固定顯示一條 `v-alert` 提示 banner（非 Chrome/Edge 才顯示；由 `App.vue` 統一輸出）
- 底層 composable：`useSpeechRecognition`（`zh-TW` 預設，`onUnmounted` 自動停止）

---

## 匯出功能（ExportDialog）⏳

行為描述：

- 對話框列出三種匯出格式選項：
  1. **Excel (.xlsx)**：下載包含表頭和資料的試算表
  2. **PDF**：下載含中文表格的 PDF 檔案
  3. **列印**：呼叫 `window.print()`，自動隱藏操作按鈕
- 選擇後立即觸發對應動作並關閉對話框

---

## 後端整合（Phase 5）⏳

前端唯一需要變動的是 `src/services/api.ts`：將 localStorage 實作替換為 HTTP fetch 呼叫。
後端 API 基底 URL 從環境變數 `VITE_API_BASE_URL` 讀取，所有頁面元件無需修改。
