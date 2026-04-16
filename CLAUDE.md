# CLAUDE.md

## 專案概述

**speak-excel** — CNC 工廠機台自主檢查表 Web App  
Vue 3 + TypeScript + Vite 前端；後端為獨立專案 speak-excel-api（Express + Supabase）

## 常用指令

```bash
npm run dev       # 啟動開發伺服器（Vite）
npm run build     # TypeScript 型別檢查 + Vite 打包
npm run preview   # 預覽打包結果
```

## 關鍵規則

- 本專案為**純前端**，目前以 localStorage 模擬 API；後端整合時切換 `src/services/api.ts`
- 語音輸入使用 Web Speech API，僅支援 Chrome / Edge，需在 UI 顯示提示
- 匯出功能分三種：Excel（xlsx）、PDF（jspdf + jspdf-autotable）、網頁列印（window.print）
- 功能開發請先建立 `docs/plans/YYYY-MM-DD-<feature>.md`；完成後移至 `docs/plans/archive/`
- 新增 View 須同步更新 `src/router/index.ts` 及 `docs/FEATURES.md`

## 詳細文件

- `./docs/README.md` — 項目介紹與快速開始
- `./docs/ARCHITECTURE.md` — 架構、目錄結構、資料流、DB Schema
- `./docs/DEVELOPMENT.md` — 開發規範、命名規則、環境變數
- `./docs/FEATURES.md` — 功能列表與完成狀態
- `./docs/TESTING.md` — 測試規範與指南
- `./docs/CHANGELOG.md` — 更新日誌

## 必要遵守項目

- 所有 Vue 元件使用 `<script setup lang="ts">` 語法
- 型別定義集中在 `src/types/index.ts`，禁止在元件內散落 interface
- API 呼叫集中在 `src/services/api.ts`，頁面元件禁止直接操作 localStorage / fetch
- 量具（Gauge）與檢查表（Checklist）的 ID 一律使用 UUID 字串格式
- 刪除操作必須顯示確認對話框，禁止直接刪除
