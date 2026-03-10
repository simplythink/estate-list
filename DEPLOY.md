# 部署到 GitHub Pages 說明

## 為什麼畫面上會出現 `{{ ... }}`？

因為 **Vue 沒有執行**。通常代表：

1. **`js/app.js` 等檔案沒有上傳到 GitHub**  
   若 `js/`、`css/` 沒有被 commit 並 push，GitHub Pages 上就沒有這些檔案，瀏覽器載入不到 `js/app.js`，Vue 不會啟動，頁面就會顯示未編譯的模板語法。

2. **解法：把整個專案（含 js、css）都推上去**

```bash
# 加入所有需要的檔案（不要漏掉 js/、css/）
git add index.html css/ js/ package.json

# 提交
git commit -m "Add app JS/CSS for GitHub Pages"

# 推送到 GitHub
git push origin main
```

3. **GitHub Pages 設定**  
   - 到 repo 的 **Settings → Pages**  
   - Source 選 **Deploy from a branch**  
   - Branch 選 `main`（或你使用的分支），資料夾選 **/ (root)**  
   - 儲存後等幾分鐘，用 `https://<你的帳號>.github.io/<repo 名稱>/` 開啟

若網站是放在子路徑（例如 `.../estate-list/`），目前使用的相對路徑 `js/app.js`、`css/styles.css` 是正確的，不需要改。
