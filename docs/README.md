# speak-excel

CNC 工廠機台**自主檢查表**生成系統。行政人員可透過 Web 介面建立、編輯、預覽、存檔檢查表，並匯出為 Excel / PDF 或直接列印。

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | Vue 3 + `<script setup>` |
| 語言 | TypeScript |
| 打包工具 | Vite |
| UI 框架 | Vuetify v3（計劃中） |
| 路由 | vue-router v4（計劃中） |
| Excel 匯出 | xlsx（SheetJS）（計劃中） |
| PDF 匯出 | jspdf + jspdf-autotable（計劃中） |
| 語音輸入 | Web Speech API（Chrome / Edge） |
| 後端 | 獨立專案 speak-excel-api（Express + Supabase）|

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

## 文件索引

| 文件 | 說明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架構、目錄結構、路由、資料流、DB Schema |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 開發規範、命名規則、新增模組步驟、環境變數 |
| [FEATURES.md](./FEATURES.md) | 功能清單與完成狀態 |
| [TESTING.md](./TESTING.md) | 測試規範與指南 |
| [CHANGELOG.md](./CHANGELOG.md) | 更新日誌 |
| [plans/](./plans/) | 進行中的開發計畫 |
| [plans/archive/](./plans/archive/) | 已完成的開發計畫 |
