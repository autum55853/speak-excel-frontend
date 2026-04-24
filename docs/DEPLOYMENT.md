# 部署指南（前端）

## 架構總覽

```
GitHub (autum55853/speak-excel-frontend)
  │
  └─ GitHub Actions (deploy.yml)
       push to main → npm run build → 上傳 dist/ → GitHub Pages
       URL: https://autum55853.github.io/speak-excel-frontend/
            ↓ VITE_API_BASE_URL
       https://speak-excel-backend.onrender.com/api（後端）
```

---

## GitHub Pages 首次設定（一次性手動）

### 步驟 1：啟用 GitHub Pages

1. 前往 `github.com/autum55853/speak-excel-frontend`
2. **Settings** → **Pages**（左側選單）
3. **Source** 選 **GitHub Actions**（不是 Deploy from a branch）
4. 儲存

### 步驟 2：設定 GitHub Secrets（API 金鑰）

1. **Settings** → **Secrets and variables** → **Actions**
2. 點擊 **New repository secret**，依序新增：

| Secret 名稱 | 值 | 說明 |
|-------------|-----|------|
| `VITE_API_BASE_URL` | `https://speak-excel-backend.onrender.com/api` | 後端 API URL（Render 部署後取得） |
| `VITE_YATING_API_KEY` | 雅婷語音 API 金鑰 | 語音辨識功能用 |

> Secrets 在 GitHub Actions log 中會自動遮蔽，不會洩漏。

### 步驟 3：觸發首次部署

push 一個 commit 到 `main` 分支，即可觸發首次 GitHub Actions 部署。

部署完成後訪問：`https://autum55853.github.io/speak-excel-frontend/`

---

## GitHub Actions 部署流程

設定檔位於 `.github/workflows/deploy.yml`，每次 push 到 `main` 時自動執行。

### 流程圖

```
push to main
  │
  └─ Job: build (ubuntu-latest)
       ├─ actions/checkout@v4        # 下載程式碼
       ├─ actions/setup-node@v4      # 安裝 Node.js 20
       ├─ npm ci                     # 安裝套件（依 package-lock.json）
       ├─ npm run build              # vue-tsc + vite build
       │    env: VITE_BASE=/speak-excel-frontend/
       │    env: VITE_API_BASE_URL=（從 Secrets 讀取）
       │    env: VITE_YATING_API_KEY=（從 Secrets 讀取）
       └─ upload-pages-artifact      # 打包 dist/ 上傳
            │
  └─ Job: deploy (依賴 build 完成)
       └─ actions/deploy-pages@v4    # 發佈到 GitHub Pages CDN
```

### 查看部署狀態

前往 GitHub → **Actions** 分頁 → 選擇最新的 workflow run，可以看到每個步驟的詳細 log。

---

## CI/CD 關鍵概念說明

### 什麼是 GitHub Actions？

GitHub Actions 是 GitHub 內建的自動化服務。在 `.github/workflows/` 目錄放置 YAML 設定檔，當指定事件（如 push）發生時，GitHub 會自動在雲端虛擬機器上執行設定的指令。

### 重要 YAML 欄位解說

```yaml
on:
  push:
    branches: [main]     # 只有 push 到 main 才觸發（不是所有分支）
  workflow_dispatch:     # 允許在 GitHub UI 手動點擊「Run workflow」觸發
```

```yaml
permissions:
  pages: write           # 允許 workflow 寫入 GitHub Pages
  id-token: write        # 允許取得 OIDC token（Pages 部署必需）
```

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false   # 若有新的 push，等舊的部署完再開始新的
```

```yaml
jobs:
  build:
    runs-on: ubuntu-latest    # 在 GitHub 的 Ubuntu 虛擬機上執行

  deploy:
    needs: build              # 必須等 build job 成功才執行
```

```yaml
env:
  VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
  # secrets.* 從 Repo Settings → Secrets 讀取，log 中顯示 ***
```

### `npm ci` vs `npm install` 的差異

| 指令 | 特性 | 適用場景 |
|------|------|---------|
| `npm install` | 依 package.json 安裝，可能更新 lock file | 本地開發 |
| `npm ci` | 嚴格依 package-lock.json，不修改 lock file | CI/CD 環境 |

`npm ci` 確保 CI 和本地使用完全相同的套件版本，避免「在我電腦上跑得好好的」問題。

### 為什麼需要 `VITE_BASE=/speak-excel-frontend/`？

Vite 打包時需要知道應用程式部署在 server 的哪個路徑下：
- 本地開發：`http://localhost:5173/` → base = `/`
- GitHub Pages：`https://autum55853.github.io/speak-excel-frontend/` → base = `/speak-excel-frontend/`

如果 base 設定錯誤，靜態資源（JS、CSS）的路徑會不正確，頁面會空白。

### SPA 路由與 404.html

Vue Router 使用 HTML5 History Mode（`createWebHistory()`），URL 看起來像 `/gauges`、`/checklist/1/edit`，這些路徑在 server 上並不存在實體檔案。

GitHub Pages 在找不到檔案時會回傳 `404.html`。專案在 `public/404.html` 放了一段 redirect script：
1. 把當前路徑打包進 query string：`/?/gauges`
2. 跳回首頁（`index.html`）
3. `index.html` 裡的 script 還原路徑
4. Vue Router 接管，正常顯示對應頁面

---

## 本地模擬 production build

```bash
# 模擬 GitHub Actions 的 build 環境
VITE_BASE=/speak-excel-frontend/ \
VITE_API_BASE_URL=https://speak-excel-backend.onrender.com/api \
npm run build

# 預覽建構結果
npm run preview
```

---

## 常見問題

**Q：push 後 Actions 沒有執行**  
A：確認 `.github/workflows/deploy.yml` 存在，且 `on.push.branches` 包含你的分支名稱（`main`）。

**Q：部署成功但頁面空白**  
A：開啟 DevTools Console，通常是 `VITE_BASE` 設定錯誤導致 JS 路徑 404。確認 `VITE_BASE=/speak-excel-frontend/`。

**Q：API 呼叫失敗（Network Error 或 CORS）**  
A：確認 `VITE_API_BASE_URL` Secret 設定正確，且後端 `FRONTEND_URL` 環境變數設為 `https://autum55853.github.io`。

**Q：重整頁面出現 GitHub Pages 的 404 頁面**  
A：確認 `public/404.html` 存在並已 commit，且 `index.html` 裡有 SPA redirect 還原 script。

**Q：手動觸發部署**  
A：GitHub → Actions → Deploy to GitHub Pages → **Run workflow** 按鈕。
