# 純前端家庭花費月曆

這是一個僅由 HTML、CSS 和 JavaScript 組成的網頁應用，用於記錄家庭日常開銷並與 Google Sheets 互動。利用 Google Apps Script 作為後端資料接口，您無需自行運行伺服器，就能透過公開網址讓任何人即時新增或查看資料。

## 架構說明

* **Google Sheets**：作為資料庫。您提供的試算表必須設定為允許 Apps Script 存取並具備編輯權限。
* **Google Apps Script**：作為 REST API。當有人從網頁發出請求時，Script 會讀取或寫入試算表，並回傳 JSON 結果。
* **前端網頁**：採用 FullCalendar 呈現日曆，使用 `fetch` 呼叫 Apps Script 讀寫資料。利用輪詢機制（每 30 秒）更新內容，以模擬即時性。

## 建立 Google Apps Script

1. **開啟您的 Google 試算表** (例如您提供的網址)。
2. 點選「擴充功能」→「應用程式腳本」，會打開 Apps Script 編輯器。
3. 刪除原有程式碼，貼上以下範例程式：

   ```javascript
   function doGet(e) {
     const action = e.parameter.action;
     const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID_HERE').getSheets()[0];
     if (action === 'getExpenses') {
       const values = sheet.getDataRange().getValues();
       const result = [];
       for (let i = 1; i < values.length; i++) {
         const row = values[i];
         result.push({
           date: row[0],
           person: row[1],
           amount: row[2],
           note: row[3] || '',
         });
       }
       return ContentService.createTextOutput(JSON.stringify(result))
         .setMimeType(ContentService.MimeType.JSON);
     }
     if (action === 'addExpense') {
       const date = e.parameter.date;
       const person = e.parameter.person;
       const amount = e.parameter.amount;
       const note = e.parameter.note || '';
       sheet.appendRow([date, person, amount, note]);
       return ContentService.createTextOutput(JSON.stringify({ success: true }))
         .setMimeType(ContentService.MimeType.JSON);
     }
     return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

   請將 `YOUR_SHEET_ID_HERE` 替換成試算表的 ID，例如網址中 `/d/` 與 `/edit` 之間的那串字。

4. **儲存並部署為網路應用程式**：
   - 點選「部署」→「部署新版本」。
   - 選擇類型為「網路應用程式」。
   - 設定執行應用程式的人員為「我」，存取權限設為「任何人」或「任何擁有此應用程式連結的人」。
   - 部署後會得到一個網址，類似 `https://script.google.com/macros/s/AKfycb.../exec`。請記下這個網址，它就是前端程式的 `API_URL`。

5. **給予試算表授權**：第一次呼叫 API 時，Apps Script 可能需要授權來編輯試算表。根據提示完成授權流程。

## 設定前端程式

1. 從本專案下載 `expense_static_web` 資料夾，這裡包含 `index.html`、`style.css` 和 `script.js`。
2. 用文本編輯器打開 `script.js`，找到 `const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';`，將其替換為您部署好的 Apps Script 網址。
3. 將整個 `expense_static_web` 資料夾上傳至任何靜態網站托管平台，例如 GitHub Pages、Netlify 或直接放在您的伺服器上。只要支援 HTTPS 即可。
4. 部署後，開啟 `index.html` 對應的網址即可使用。由於所有資料儲存與讀取都透過 Google Apps Script，您不需要再啟動伺服器。

## 注意事項

* 由於採用 Google Apps Script 作為後端，第一次使用時可能會出現授權畫面。只需授權一次即可。
* 此應用程式使用簡易的輪詢方式更新資料，若需要更即時的同步，可在 Apps Script 內加入推播服務或改用第三方服務。
* 前端使用 CDN 載入 FullCalendar，如遇網路限制可改為本地引入。