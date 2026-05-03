# Diet App Worklog

## 2026-05-03 收工紀錄

### 本次狀態

- 已讀取本機專案 `C:\Users\User\diet-app-git`。
- `diet-app-git` 是 Git repo，遠端為 `https://github.com/weida6610/diet-app.git`。
- 開工時 `main` 與 `origin/main` 同步，工作樹乾淨。
- 本次沒有修改 app 程式邏輯、樣式或部署檔。

### 專案結構

- `index.html`：靜態 PWA 介面，含密碼頁、計算機、飲食代換表、底部導覽。
- `app.js`：密碼、BMR/TDEE、份量計算、代換表資料。
- `style.css`：深色行動版 UI。
- `manifest.json`：PWA manifest。
- `sw.js`：Service Worker，目前 cache 名稱為 `rbtc-diet-v6`。

### 已確認的問題與差異

- `C:\Users\User\diet-app-src` 也存在，像是 Firebase hosting 部署資料夾。
- `diet-app-src` 與 `diet-app-git` 的 `app.js`、`style.css`、`sw.js` 相同。
- 兩者 `index.html` 不同：`diet-app-src/index.html` 多了「外食」按鈕與較新的資料來源文字。
- `diet-app-git/app.js` 已有 `eating-out` 外食資料，但 `diet-app-git/index.html` 尚未提供外食入口。

### Excel 參考檔

- 已讀取 `C:\Users\User\Desktop\營養方針\均衡飲食份量估算Tina哈哈營養師.xlsx`。
- 工作簿有兩張表：
  - `(男)一日減肥份數計算-均衡版`
  - `(女)一日減肥份數計算-均衡版`
- Excel 使用 20 / 30 / 50 的蛋白質、脂質、醣類比例。
- Excel 的真正計算熱量是黃色欄位 `N5`「給予熱量」，不是直接套固定 TDEE 折扣。
- Excel 有 `TDEE - 500` 與 `TDEE - 300` 作為參考，但仍由使用者手動指定給予熱量。

### Diet App 與 Excel 的主要差異

- App 目前自動用 `TDEE * 0.84` 當目標熱量，常比 Excel 的 `給予熱量` 高。
- App 使用 Revised Harris-Benedict；Excel 使用舊版 Harris-Benedict。
- Excel 中脂蛋白每份為 `P7 / F5 / 75 kcal`；App 目前為 `P7.24 / F5.175 / 77.6 kcal`。
- Excel 飯 1 碗為 `P8 / C60 / 280 kcal`；App 目前為 `P8.7 / C65.2 / 304.1 kcal`。
- Excel 油脂 1 份為 `F5 / 45 kcal`；App 目前為 `F4.5 / 40.4 kcal`。
- App 目前把飯、蛋白質、油脂轉成整數份數，Excel 保留小數份數。

### 油脂偏高判斷

- 油脂偏高的主因不是 30% 脂質比例本身。
- 主要原因是 App 自動目標熱量偏高，加上油脂每份用 4.5g 並四捨五入成整數。
- Excel 預設案例：
  - 女 85kg / 170cm / 35歲 / 週 3-5 天：Excel 給予熱量 1400，油脂約 2.9 份；App 目標熱量約 2095，油脂 5 份。
  - 男 85kg / 170cm / 35歲 / 週 3-5 天：Excel 給予熱量 1900，油脂約 3.9 份；App 目標熱量約 2401，油脂 5 份。

### 下次接續建議

- 先決定是否新增「Tina 均衡版」模式。
- 建議調整方向：
  - 顯示 TDEE、`TDEE - 500`、`TDEE - 300`。
  - 新增或改為可輸入「給予熱量」。
  - 計算份量改用 Excel 標準份量。
  - 油脂、蛋白質、飯碗建議顯示到 0.5 份或 0.1 份，不要全部整數化。
  - 補上 `diet-app-git/index.html` 的外食入口。
  - App 文案註明油脂份數包含烹調油、堅果、醬料與外食隱藏油，不是額外加油。

### 付費開放初步方向

- 現有前端硬編碼密碼只適合內部工具，不適合付費學員。
- 付費版可用 Firebase Hosting + Firebase Auth 或 LINE Login / LIFF。
- Firestore 可存會員權限，例如 `userId`、`plan`、`paidUntil`、`coachId`、`status`。
- 初期可人工收款後開通；成熟後再接綠界、藍新或 LINE Pay webhook。
- 免費版可保留有限試算或代換表；付費版開放完整計算、外食表、個人紀錄、教練備註。

## 2026-05-03 開工調整紀錄

### 已實作

- 新增「給予熱量」輸入欄位，留空時預設使用 `TDEE - 500`。
- 新增 `-500`、`-300` 快速帶入按鈕。
- 結果區新增 `TDEE - 500`、`TDEE - 300`、熱量差。
- 計算公式改用 Tina 均衡版 Excel 的 Harris-Benedict 公式。
- 計算用份量改為 Excel 標準：
  - 中脂蛋白：`P7 / F5 / 75 kcal`
  - 飯 1 碗：`P8 / C60 / 280 kcal`
  - 油脂：`F5 / 45 kcal`
- 飯、豆魚蛋肉、油脂改為 0.5 單位顯示。
- 結果說明補上油脂份數包含烹調油、堅果、醬料與外食隱藏油。
- 代換表補上 `外食` 入口，資料來源文字同步為國健署加 Tina 營養師實務經驗。
- Service Worker cache bump 到 `rbtc-diet-v7`。

### 驗證

- `node --check app.js` 通過。
- Tina Excel 預設案例改動後：
  - 女 85kg / 170cm / 35歲 / 週 3-5 天，手動給予熱量 1400：油脂約 2.5 份。
  - 男 85kg / 170cm / 35歲 / 週 3-5 天，手動給予熱量 1900：油脂約 4 份。
