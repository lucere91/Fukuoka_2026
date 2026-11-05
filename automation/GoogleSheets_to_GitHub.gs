/**
 * 후쿠오카 공금 전용 Google Sheets → GitHub Pages 동기화
 * 출처: 공금 파일의 00_요약, 01_지출원장 (개인카드 파일 접근 금지)
 * GitHub 저장소는 공개이므로 승인된 영수증 이미지만 사용.
 *
 * Script Properties:
 *   GITHUB_REPO=lucere91/Fukuoka_2026
 *   GITHUB_TOKEN= (fine-grained PAT, Contents: Read and write)
 */
const FUKUOKA_CASH_SHEET_ID = '10TRwn30Vk7KGTMkjnGz3nT9A7SFL55dM0TQvYzqgTwU';
const FUKUOKA_TZ = 'Asia/Tokyo';
const PUBLIC_RECEIPTS = {
  'R-1102-01': 'assets/receipts/R-1102-01.jpg',
  'R-1102-02': 'assets/receipts/R-1102-02.jpg',
  'R-1102-03': 'assets/receipts/R-1102-03.jpg',
  'R-1102-04': 'assets/receipts/R-1102-04.jpg',
  'R-1102-05': 'assets/receipts/R-1102-05.jpg',
  'R-1102-06': 'assets/receipts/R-1102-06.jpg',
  'R-1102-07': 'assets/receipts/R-1102-07.jpg',
  'R-1103-01': 'assets/receipts/R-1103-01.jpg',
  'R-1103-02': 'assets/receipts/R-1103-02.jpg',
  'R-1103-03': 'assets/receipts/R-1103-03.jpg',
  'R-1104-01': 'assets/receipts/R-1104-01.jpg',
  'R-1104-02': 'assets/receipts/R-1104-02.jpg',
  'R-1104-03': 'assets/receipts/R-1104-03.jpg',
  'R-1104-04': 'assets/receipts/R-1104-04.jpg',
  'R-1104-05': 'assets/receipts/R-1104-05.jpg',
  'R-1105-01': 'assets/receipts/R-1105-01.jpg',
  'R-1105-02': 'assets/receipts/R-1105-02.jpg',
};
function syncPublicTrip() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const repo = (props.getProperty('GITHUB_REPO') || '').trim();
    const token = (props.getProperty('GITHUB_TOKEN') || '').trim();
    if (!/^[\\w.-]+\\/[\\w.-]+$/.test(repo)) throw Error('GITHUB_REPO 설정 필요');
    if (!token) throw Error('GITHUB_TOKEN 설정 필요');
    const book = SpreadsheetApp.openById(FUKUOKA_CASH_SHEET_ID);
    const summary = book.getSheetByName('00_요약');
    const ledger = book.getSheetByName('01_지출원장');
    if (!summary || !ledger) throw Error('공금 탭이 없습니다');
    const rows = ledger.getRange(6, 1, Math.max(1, ledger.getLastRow()-5), 13).getValues();
    const records = [];
    for (const row of rows) {
      const id = String(row[0]||'');
      if (!/^R-/.test(id) || String(row[8]).trim() !== '예') continue;
      const date = row[1] instanceof Date
        ? Utilities.formatDate(row[1],FUKUOKA_TZ,'yyyy-MM-dd')
        : String(row[1]||'').slice(0,10);
      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw Error('날짜 확인: '+id);
      records.push({id,date,time:String(row[2]||''),kind:'shared',
        category:String(row[3]||'기타'),merchant:String(row[4]||''),
        detail:String(row[5]||''),amount:Number(row[6])||0,
        receipt:PUBLIC_RECEIPTS[id]||null,count:id==='R-1103-05'?2:1});
    }
    const pack = {
      updatedAt: Utilities.formatDate(new Date(),FUKUOKA_TZ,'yyyy-MM-dd HH:mm'),
      trip:'후쿠오카 2026 · 공금',
      sharedTotal:Number(summary.getRange('A6').getValue())||0,
      sharedSpent:Number(summary.getRange('C6').getValue())||0,
      sharedBalance:Number(summary.getRange('E6').getValue())||0,
      records
    };
    if (pack.sharedTotal-pack.sharedSpent!==pack.sharedBalance)
      throw Error('공금 장부 검증 실패');
    if (records.reduce((s,r)=>s+r.amount,0)!==pack.sharedSpent)
      throw Error('거래 합계 불일치');
    putGitHub_(repo,token,'data/ledger.js','window.__TRIP_LEDGER__ = '+JSON.stringify(pack)+';\\n','공금 내역 자동 갱신');
    putGitHub_(repo,token,'data/ledger.json',JSON.stringify(pack,null,2)+'\\n','공금 JSON 자동 갱신');
    Logger.log('공금 전용 동기화 완료: '+records.length+'행');
  } finally { lock.releaseLock(); }
}
function installPublicSyncTrigger() {
  const name='syncPublicTrip';
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===name).forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(name).timeBased().everyMinutes(15).create();
  syncPublicTrip();
}
function putGitHub_(repo,token,path,content,message) {
  const url='https://api.github.com/repos/'+repo+'/contents/'+path;
  const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28','User-Agent':'Fukuoka-Cash-Ledger'};
  const old=UrlFetchApp.fetch(url,{headers,muteHttpExceptions:true});
  if (![200,404].includes(old.getResponseCode())) throw Error('GitHub read: '+old.getResponseCode());
  const previous=old.getResponseCode()===200?JSON.parse(old.getContentText()):null;
  const body={message,content:Utilities.base64Encode(Utilities.newBlob(content).getBytes()),branch:'main'};
  if (previous?.sha) body.sha=previous.sha;
  const res=UrlFetchApp.fetch(url,{method:'put',headers,contentType:'application/json',payload:JSON.stringify(body),muteHttpExceptions:true});
  if (res.getResponseCode()<200||res.getResponseCode()>299) throw Error('GitHub write: '+res.getResponseCode());
}
