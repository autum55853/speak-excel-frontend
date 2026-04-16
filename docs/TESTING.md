# TESTING.md

## 目前狀態

本專案尚未設定自動化測試框架。以下為規劃方向與手動測試指南。

---

## 規劃的測試框架

| 層級 | 工具 | 說明 |
|------|------|------|
| 單元測試 | Vitest | 測試 composables、api.ts 函式 |
| 元件測試 | @vue/test-utils + Vitest | 測試 Vue 元件互動 |
| E2E 測試 | Playwright（可選） | 測試完整使用者流程 |

安裝指令（待執行）：
```bash
npm install -D vitest @vue/test-utils @vitejs/plugin-vue jsdom
```

---

## 手動測試清單

每次功能完成後，執行以下流程驗證：

### 核心流程
- [ ] 新增檢查表 → 填寫所有欄位 → 儲存 → 預覽頁顯示正確
- [ ] 編輯已存在的檢查表 → 修改內容 → 儲存 → 確認更新
- [ ] 首頁列表按存檔時間降序排列
- [ ] 點擊列表進入預覽模式

### 量具管理
- [ ] 新增量具 → 顯示於下拉選單
- [ ] 新增重複名稱量具 → 顯示錯誤提示，不執行新增
- [ ] 刪除量具 → 確認對話框 → 量具從列表消失
- [ ] 已使用被刪除量具的檢查表 → 量具欄顯示「（已刪除）」

### 語音輸入（需 Chrome / Edge）
- [ ] 點擊麥克風 → 按鈕變紅 → 說話 → 文字追加至輸入框
- [ ] 再次點擊 → 停止錄音
- [ ] 非 Chrome/Edge 瀏覽器 → 顯示提示 banner，按鈕 disabled

### 匯出
- [ ] Excel 匯出 → 下載 .xlsx 檔案，表格內容正確
- [ ] PDF 匯出 → 下載 .pdf 檔案，中文顯示正確
- [ ] 列印模式 → 操作按鈕隱藏，表格完整顯示

---

## 撰寫 Vitest 測試的步驟（未來）

1. 在 `src/` 旁建立 `tests/` 目錄
2. 測試檔案命名：`*.test.ts`
3. composable 測試範例：
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { useExport } from '../src/composables/useExport'

   describe('useExport', () => {
     it('generates correct filename', () => {
       // ...
     })
   })
   ```
4. 執行測試：`npm run test`

---

## 常見測試陷阱

- Web Speech API 在測試環境不可用，需要 mock `window.SpeechRecognition`
- localStorage 在各測試間需要 `beforeEach` 清空，避免狀態污染
- UUID 生成函式需要 mock，以確保測試結果可重現
