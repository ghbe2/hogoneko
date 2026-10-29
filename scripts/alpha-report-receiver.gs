/** Bound to the private alpha-report spreadsheet. Deploy as a web app executing as owner. */
function setupAlphaReports() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('REPORT_SHEET_ID', book.getId());
  if (!props.getProperty('REPORT_FOLDER_ID')) {
    props.setProperty('REPORT_FOLDER_ID', DriveApp.createFolder('つぐねこ αテスト・報告画像').getId());
  }
  const sheet = book.getSheetByName('報告') || book.insertSheet('報告');
  if (!sheet.getLastRow()) {
    sheet.appendRow(['受付ID','受信日時','種類','操作手順','起きたこと・期待したこと','画面','店舗','案内','育成日','画面サイズ','バージョン','ブラウザ','画像','対応状況']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:N1').setBackground('#657d59').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setColumnWidths(3, 3, 240);
    sheet.getRange('D:E').setWrap(true);
  }
}
function doPost(e) {
  const output = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const safeText = (value, max) => {
    const text = String(value == null ? '' : value).slice(0, max);
    return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
  };
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 3000000) throw Error('invalid payload');
    const p = JSON.parse(e.postData.contents);
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(p.id) || !p.steps || !p.description) throw Error('missing report');
    if (p.screenshot && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.screenshot)) throw Error('invalid image');
    const props = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.openById(props.getProperty('REPORT_SHEET_ID')).getSheetByName('報告');
    lock = LockService.getScriptLock();
    lock.waitLock(15000);
    // Retrying a timed-out request must never create a duplicate report or image.
    if (sheet.getLastRow() > 1 && sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(p.id).matchEntireCell(true).findNext()) return output({ok:true,id:p.id});
    let imageUrl = '';
    if (p.screenshot) {
      const bytes = Utilities.base64Decode(p.screenshot.split(',')[1]);
      if (bytes.length > 2000000) throw Error('image too large');
      const folder = DriveApp.getFolderById(props.getProperty('REPORT_FOLDER_ID'));
      // Do not make images or reports publicly readable.
      imageUrl = folder.createFile(Utilities.newBlob(bytes,'image/jpeg',p.id+'.jpg')).getUrl();
    }
    sheet.appendRow([p.id,new Date(),safeText(p.category,80),safeText(p.steps,3000),safeText(p.description,3000),safeText(p.phase,80),safeText(p.shop,80),safeText(p.guide,100),Number(p.day)||0,safeText(p.viewport,40),safeText(p.version,80),safeText(p.userAgent,600),imageUrl,'未確認']);
    return output({ok:true,id:p.id});
  } catch (error) {
    return output({ok:false,error:'受付を完了できませんでした。時間をおいて再送してください。'});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
