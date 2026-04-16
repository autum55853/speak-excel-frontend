# DEVELOPMENT.md

## 命名規則

| 類別 | 規則 | 範例 |
|------|------|------|
| Vue 元件檔案 | PascalCase | `ChecklistTable.vue` |
| View 元件 | PascalCase + `View` 後綴 | `ChecklistListView.vue` |
| Composable 檔案 | camelCase + `use` 前綴 | `useSpeechRecognition.ts` |
| TypeScript 介面 | PascalCase | `interface ChecklistRow` |
| 資料庫欄位 | snake_case | `checklist_id`, `sort_order` |
| 前端型別 ID | camelCase | `gaugeId`, `checklistId` |
| 環境變數 | `VITE_` 前綴（前端用） | `VITE_API_BASE_URL` |

---

## 模組系統

本專案使用 ES Module（`"type": "module"` 於 package.json）。

- 所有 import 使用具名匯出或預設匯出，禁止 `require()`
- Vue 元件一律使用 `<script setup lang="ts">` Composition API 語法
- 型別定義集中在 `src/types/index.ts`，元件內禁止定義 interface

---

## 新增 View 頁面步驟

1. 在 `src/views/` 建立 `YourFeatureView.vue`
2. 在 `src/router/index.ts` 新增路由設定
3. 若有新的資料操作，在 `src/services/api.ts` 新增對應函式
4. 更新 `docs/FEATURES.md` 功能狀態

---

## 新增可複用元件步驟

1. 在 `src/components/` 建立 `YourComponent.vue`
2. 元件 props 型別須使用 `defineProps<{...}>()` 明確宣告
3. 元件 emits 須使用 `defineEmits<{...}>()` 明確宣告

---

## 新增 Composable 步驟

1. 在 `src/composables/` 建立 `useYourFeature.ts`
2. 函式以 `use` 開頭，回傳 reactive 狀態與操作函式
3. 若涉及瀏覽器 API，須在 `onMounted` 後才存取（SSR 安全）

---

## 環境變數

| 變數名稱 | 用途 | 必要性 | 預設值 |
|---------|------|-------|--------|
| `VITE_API_BASE_URL` | 後端 API 基底 URL | Phase 5 後必要 | 無（Phase 5 前使用 localStorage） |

環境變數放在 `.env`（開發）或 `.env.production`（正式），`.env` 不納入版控（已加入 .gitignore）。

在程式碼中讀取：
```typescript
const apiBase = import.meta.env.VITE_API_BASE_URL
```

---

## 計畫歸檔流程

1. 計畫檔案命名格式：`YYYY-MM-DD-<feature-name>.md`
2. 計畫文件結構：User Story → Spec → Tasks
3. 功能完成後：移至 `docs/plans/archive/`
4. 更新 `docs/FEATURES.md` 功能狀態（⏳ → ✅）
5. 在 `docs/CHANGELOG.md` 新增版本條目

---

## 程式碼風格

- TypeScript strict mode 已啟用（`tsconfig.app.json`）
- 禁止使用 `any` 型別，一律明確宣告型別
- async/await 取代 .then() 鏈式呼叫
- 錯誤處理：預期內的錯誤（如量具名稱重複）顯示 UI 提示，非預期錯誤使用 console.error 記錄
