# CHANGELOG.md

版本格式：`YYYY-MM-DD — 版本說明`

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
