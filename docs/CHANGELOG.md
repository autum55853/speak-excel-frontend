# CHANGELOG.md

版本格式：`YYYY-MM-DD — 版本說明`

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
