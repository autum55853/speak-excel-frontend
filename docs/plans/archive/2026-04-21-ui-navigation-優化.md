# 2026-04-21 UI / Navigation 優化

## 背景

目前畫面整頁黑底、元件擠在一起（檢查表列表、新增按鈕、刪除對話框全部擠在同一行），
`v-app-bar` 也只有單一「量具管理」按鈕，缺少完整導覽。

## 根因

1. `src/style.css` 保留 Vite starter template 的樣式：
   - `:root` 的 `color-scheme: light dark` + `@media (prefers-color-scheme: dark)`
     強制套用 `#16171d` 深色背景，覆蓋 Vuetify 主題。
   - `#app { width: 1126px; text-align: center; border-inline: 1px solid ... }`
     把 `v-app` 的 flex/layout 擠壞。
   - `h1/h2` 全域字級與顏色設定覆蓋 Vuetify typography。
2. `App.vue` 的 `v-app-bar` 只有「量具管理」一個按鈕；沒有側欄或清楚的主要路由入口。
3. Vuetify 主題只有最基本的 Material 預設色，缺少 surface / background 層次。
4. `ChecklistListView` / `GaugeManageView` 空狀態只有冷冰冰的一行文字。

## 實施步驟

### 1. 清理全域樣式

- 清空 `src/style.css`，只保留：
  - `body { margin: 0 }` 與 `html, body, #app { height: 100% }`
  - `@media print` 中讓 `.no-print` 隱藏的規則（原 App.vue 已有）
- 移除所有 Vite starter 的 `.hero` / `#next-steps` / `#docs` / `#spacer` / `.ticks` 樣式。

### 2. 優化 Vuetify 主題（`src/plugins/vuetify.ts`）

- primary 改為工業感的深藍 `#1E3A8A`（Indigo 900 附近）
- 新增 secondary `#475569`（Slate 600）、背景 surface `#F8FAFC`
- 保留 light theme，不啟用 system dark（避免與 print 衝突）

### 3. 改寫 `App.vue` 加入完整導覽

- 加入 `v-navigation-drawer`（桌機預設展開、手機收合）
- 側欄選單：
  - 檢查表列表（mdi-clipboard-list）
  - 新增檢查表（mdi-file-plus）
  - 量具管理（mdi-ruler）
- `v-app-bar` 加入漢堡按鈕切換 drawer；標題連回首頁
- 頁尾加 `v-footer` 顯示版本 / 版權（可選）
- `@media print` 隱藏 `v-app-bar`、`v-navigation-drawer`、`v-footer`

### 4. 優化空狀態

- `ChecklistListView` 當 `items.length === 0 && !loading` 時顯示 `v-empty-state`
  （標題「尚無檢查表」、副標「點右上角『新增文件』開始建立」、icon `mdi-clipboard-text-off`）
- `GaugeManageView` 同樣改成 `v-empty-state`（若目前 `v-data-table` 預設訊息不夠醒目）

### 5. 文件同步

- 更新 `docs/CHANGELOG.md` 新增本次 UI 優化條目
- 完成後計畫移至 `docs/plans/archive/`

## 驗證

- `npm run build` 通過（vue-tsc 型別檢查 + vite build）
- 手動開啟 dev server 檢查：
  - Light 模式下背景為淺色，不再黑底
  - 側欄三個連結可導覽至對應 route
  - 桌機 / 手機寬度下 drawer 行為正確
  - 列印預覽中 `v-app-bar` / drawer 不顯示

## 風險

- 移除全域 `h1/h2` 樣式後，若某些 View 依賴其字級需改用 Vuetify typography class（`text-h4` 等），需實際驗證。
- Vuetify 主題色調整後，所有 `color="primary"` 按鈕顏色會跟著變，需確認對比度。
