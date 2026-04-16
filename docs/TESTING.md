# TESTING.md

## 目前狀態

自動化測試框架已安裝並設定完成（2026-04-16）。

| 層級 | 工具 | 版本 | 狀態 |
|------|------|------|------|
| 單元測試 | Vitest | ^4.1.4 | 已安裝 |
| 元件測試 | @vue/test-utils | ^2.4.6 | 已安裝 |
| 覆蓋率 | @vitest/coverage-v8 | ^4.1.4 | 已安裝 |
| 測試環境 | jsdom | ^29.0.2 | 已安裝 |
| E2E 測試 | Playwright（可選） | — | 未安裝 |

### 設定位置

- 測試設定：`vite.config.ts` → `test` 區塊
- 全域初始化：`tests/setup.ts`（localStorage 清空 + Speech API mock）
- 環境驗證：`tests/example.test.ts`

---

## 常用指令

```bash
npm run test          # 監聽模式（開發中使用）
npm run test:run      # 單次執行所有測試
npm run test:coverage # 執行並產生覆蓋率報告
```

## 目錄結構

```
tests/
├── setup.ts              # 全局 Mock 設定（localStorage、SpeechRecognition）
├── example.test.ts       # 環境驗證範例
├── composables/          # composable 單元測試
├── services/             # api.ts / localStorage 操作測試
└── components/           # Vue 元件互動測試
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

## 撰寫 Vitest 測試

測試檔案放在對應子目錄，命名格式：`<target>.test.ts`。

composable 測試範例：
```typescript
import { describe, it, expect } from 'vitest'
import { useExport } from '../../src/composables/useExport'

describe('useExport', () => {
  it('generates correct filename', () => {
    // ...
  })
})
```

元件測試範例：
```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MyComponent from '../../src/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.exists()).toBe(true)
  })
})
```

---

## 常見測試陷阱

- Web Speech API 在測試環境不可用，需要 mock `window.SpeechRecognition`
- localStorage 在各測試間需要 `beforeEach` 清空，避免狀態污染
- UUID 生成函式需要 mock，以確保測試結果可重現
