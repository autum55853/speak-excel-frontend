# CHANGELOG.md

版本格式：`YYYY-MM-DD — 版本說明`

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
