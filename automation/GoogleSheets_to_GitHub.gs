/**
 * 후쿠오카 여행 정산 → 공개 GitHub Pages 데이터 동기화
 * 입력 원본: 개인 Google Sheets. 배포 대상: GitHub Pages 정적 파일.
 *
 * 주의: 동기화된 거래내역과 이미지 파일은 공개됩니다.
 * Google Sheets/Drive에 대한 접근권한을 뷰어에게 주지 않아도 되지만,
 * 거래내역/영수증이 공개 GitHub 저장소의 파일로 복제됩니다.
 *
 * Script Properties (Apps Script > 프로젝트 설정 > 스크립트 속성)
 *  GITHUB_TOKEN   = fine-grained PAT (Contents: Read and write)
 *  GITHUB_REPO    = lucere91/Fukuoka_2026 (확정 저장소)
 */
const FUKUOKA_SHEET_ID = '10TRwn30Vk7KGTMkjnGz3nT9A7SFL55dM0TQvYzqgTwU';
const FUKUOKA_ZONE = 'Asia/Tokyo';
const FUKUOKA_PUBLIC_OVERRIDES = {
  // 이미 공개용으로 검토·편집한 사진 11장. 첫 동기화에서도 개인 Drive 원본으로 덮어쓰지 않음.
  'P-1102-01': 'assets/receipts/P-1102-01.jpg',
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
};
function syncPublicTrip() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const prop = PropertiesService.getScriptProperties();
    const repo = (prop.getProperty('GITHUB_REPO') || '').trim();
    const token = (prop.getProperty('GITHUB_TOKEN') || '').trim();
    if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw Error('GITHUB_REPO 스크립트 속성을 설정해 주세요.');
    if (!token) throw Error('GITHUB_TOKEN 스크립트 속성을 설정해 주세요.');
    const book = SpreadsheetApp.openById(FUKUOKA_SHEET_ID);
    const summary = book.getSheetByName('00_요약');
    const card = book.getSheetByName('03_개인카드');
    const shared = book.getSheetByName('01_지출원장');
    if (!summary || !card || !shared) throw Error('필수 시트 탭을 찾지 못했습니다.');
    const rowCash = shared.getRange(6,1,Math.max(1,shared.getLastRow()-5),13);
    const rowCard = card.getRange(19,1,Math.max(1,card.getLastRow()-18),11);
    const valuesCash = rowCash.getValues();
    const formulasCash = rowCash.getFormulas();
    const valuesCard = rowCard.getValues();
    const formulasCard = rowCard.getFormulas();
    const all = [];
    for(let i=0;i<valuesCash.length;i++) {
      const v=valuesCash[i];
      if(!v[0] || String(v[8]).trim()!=='예') continue;
      const receiptId = driveFileId_(formulasCash[i][11]);
      const id=String(v[0]);
      const rec={id, date:isoDate_(v[1]),time:String(v[2]||''),kind:'shared',
        category:String(v[3]||'기타'),merchant:String(v[4]||''),detail:String(v[5]||''),
        amount:Number(v[6])||0,receipt:null,count: id==='R-1103-05' ? 2 : 1};
      rec.receipt=publicAsset_(id,receiptId,repo,token,prop);
      all.push(rec);
    }
    for(let i=0;i<valuesCard.length;i++) {
      const v=valuesCard[i];
      if(!v[0] || !v[1]) continue;
      const id=String(v[0]);
      const receiptId=driveFileId_(formulasCard[i][8]);
      const rec={id,date:isoDate_(v[1]),time:String(v[2]||''),kind:'personal',
        category:String(v[3]||'쇼핑'),merchant:String(v[4]||''),detail:String(v[5]||''),
        amount:Number(v[6])||0,receipt:null,count:1};
      rec.receipt=publicAsset_(id,receiptId,repo,token,prop);
      all.push(rec);
    }
    const pack = {
      trip:'후쿠오카 2026',
      sharedTotal:Number(summary.getRange('A6').getValue())||0,
      sharedSpent:Number(summary.getRange('C6').getValue())||0,
      sharedBalance:Number(summary.getRange('E6').getValue())||0,
      cardSpent:Number(card.getRange('G6').getValue())||0,
      cardBalance:Number(card.getRange('I6').getValue())||0,
      cardDeposits:(Number(card.getRange('A6').getValue())||0)+(Number(card.getRange('C6').getValue())||0),
      cardWithdrawn:Number(card.getRange('E6').getValue())||0,
      records:all
    };
    const bytes = Utilities.newBlob(JSON.stringify(pack)).getBytes();
    const fingerprint = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes)).slice(0,32);
    if(prop.getProperty('LAST_PUBLIC_HASH')===fingerprint) {Logger.log('변경된 내역 없음');return;}
    const publish = Object.assign({updatedAt:Utilities.formatDate(new Date(),FUKUOKA_ZONE,'yyyy-MM-dd HH:mm')},pack);
    putGitHub_(repo,token,'data/ledger.js',Utilities.newBlob('window.__TRIP_LEDGER__ = '+JSON.stringify(publish)+';\n','text/javascript').getBytes(),'Update Fukuoka ledger from Google Sheets');
    putGitHub_(repo,token,'data/ledger.json',Utilities.newBlob(JSON.stringify(publish,null,2),'application/json').getBytes(),'Update Fukuoka ledger JSON');
    prop.setProperty('LAST_PUBLIC_HASH',fingerprint);
    Logger.log('동기화 완료: 공금 '+pack.sharedSpent+'엔, 영수증 포함 거래 '+all.length+'행');
  } finally {lock.releaseLock();}
}
function installPublicSyncTrigger() {
  const f='syncPublicTrip';
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===f).forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(f).timeBased().everyMinutes(15).create();
  syncPublicTrip();
}
function publicAsset_(id,fileId,repo,token,prop) {
  if(FUKUOKA_PUBLIC_OVERRIDES[id]) return FUKUOKA_PUBLIC_OVERRIDES[id];
  if(!fileId) return null;
  const file=DriveApp.getFileById(fileId);
  const mime=file.getMimeType();
  if(!/^image\/(png|jpeg|webp)$/i.test(mime)) {
    // PDF 원본에는 승인전표 등 민감정보가 포함될 수 있으므로 자동 게시하지 않음.
    // 공개용 이미지(JPG/PNG)를 Drive에 올리고 시트의 영수증 링크를 그 파일로 바꿔 주세요.
    return null;
  }
  const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
  const path='assets/receipts/'+id+'.'+ext;
  const version=fileId+'/'+file.getLastUpdated().getTime();
  if(prop.getProperty('ASSET_SYNC_'+id)!==version) {
    putGitHub_(repo,token,path,file.getBlob().getBytes(),'Receipt '+id);
    prop.setProperty('ASSET_SYNC_'+id,version);
  }
  return path;
}
function driveFileId_(formula) {
  if(!formula) return '';
  const m=String(formula).match(/(?:\/file\/d\/|[?&]id=)([-\w]{15,})/);
  return m?m[1]:'';
}
function isoDate_(value){
  if(value instanceof Date) return Utilities.formatDate(value,FUKUOKA_ZONE,'yyyy-MM-dd');
  const s=String(value||'');
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  throw Error('날짜 형식 오류: '+s);
}
function putGitHub_(repo,token,path,bytes,message) {
  const url='https://api.github.com/repos/'+repo+'/contents/'+path.split('/').map(encodeURIComponent).join('/');
  const headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Fukuoka-Ledger-Sync'};
  const current=UrlFetchApp.fetch(url,{headers,muteHttpExceptions:true});
  if(current.getResponseCode()!==200 && current.getResponseCode()!==404) throw Error('GitHub 읽기 오류: '+current.getResponseCode()+' '+current.getContentText().slice(0,120));
  const existing=current.getResponseCode()===200?JSON.parse(current.getContentText()):null;
  const put={message,content:Utilities.base64Encode(bytes),branch:'main'};
  if(existing?.sha) put.sha=existing.sha;
  const reply=UrlFetchApp.fetch(url,{method:'put',headers,contentType:'application/json',payload:JSON.stringify(put),muteHttpExceptions:true});
  if(reply.getResponseCode()<200||reply.getResponseCode()>=300) throw Error('GitHub 저장 오류 '+path+': '+reply.getResponseCode()+' '+reply.getContentText().slice(0,220));
}
