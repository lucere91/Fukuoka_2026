(() => {
  'use strict';
  const data = window.__TRIP_LEDGER__;
  const $ = (id)=>document.getElementById(id);
  const money = (n) => '¥' + Number(n||0).toLocaleString('ja-JP');
  const days = {'2026-11-02':'11월 2일 월요일','2026-11-03':'11월 3일 화요일','2026-11-04':'11월 4일 수요일','2026-11-05':'11월 5일 목요일'};
  const svg=(name)=>({
    '식사':'<circle cx="12" cy="12" r="8"></circle><path d="M4 12h16M12 4v16"></path>',
    '카페':'<path d="M5 6h12v9a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V6ZM17 8h2a3 3 0 0 1 0 6h-2"></path>',
    '마트':'<path d="M3 5h2l2 12h11l2-8H6M9 21h.01M17 21h.01"></path>',
    '편의점':'<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M4 10h16M9 5v15"></path>',
    '간식':'<path d="M5 9h14l-2 11H7L5 9Zm2-4h10M12 4v5"></path>',
    '쇼핑':'<rect x="4" y="8" width="16" height="13" rx="2"></rect><path d="M8 9V7a4 4 0 0 1 8 0v2"></path>',
    '기타':'<circle cx="12" cy="12" r="9"></circle><path d="M8 12h8"></path>'
  }[name]||'<circle cx="12" cy="12" r="8"/>');
  const icon=(kind)=>'<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none">'+svg(kind)+'</svg>';
  let kind='all',date='all',mode='list',photoRecords=[],photoIndex=0;
  const escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const records=(data?.records||[]).map(r=>({...r,amount:+r.amount})).sort((a,b)=>(b.date+' '+(b.time||'')).localeCompare(a.date+' '+(a.time||'')));
  if(!data){$('transactions').innerHTML='<div class="empty">지출 데이터를 불러오지 못했습니다.</div>';return;}
  $('sharedBalance').textContent=money(data.sharedBalance);
  $('sharedSpent').textContent=money(data.sharedSpent);
  $('sharedTotal').textContent=money(data.sharedTotal);
  $('cardSpent').textContent=money(data.cardSpent);
  $('cardBalance').textContent=money(data.cardBalance);
  $('progressBar').style.width=(100*(data.sharedBalance/Math.max(1,data.sharedTotal)))+'%';
  $('lastUpdated').textContent=(data.updatedAt||'').replaceAll('-','.').replace(/\s+\d\d:\d\d$/,'')+' 기준';
  function filtered(){return records.filter(r=>(kind==='all'||r.kind===kind)&&(date==='all'||r.date===date));}
  const payType=r=>r.kind==='personal'?'개인카드':'공금';
  function draw(){
    const arr=filtered();const count=arr.reduce((a,r)=>a+(r.count||1),0);
    $('txCount').textContent='총 '+count+'건';
    $('filterResult').textContent=count+'건 · '+money(arr.reduce((s,r)=>s+r.amount,0));
    if(!arr.length){$('transactions').innerHTML='<div class="empty"><div class="empty-icon">◌</div>등록된 거래내역이 없습니다.</div>';return;}
    const groups=[...new Set(arr.map(r=>r.date))];
    if(mode==='gallery'){
      $('transactions').className='transactions gallery';
      $('transactions').innerHTML=arr.map(r=>'<button type="button" class="gallery-card" data-photo="'+escapeHtml(r.id)+'" aria-label="'+escapeHtml(r.merchant)+' 상세 보기"><div class="gallery-photo">'+(r.receipt?'<img loading="lazy" src="'+escapeHtml(r.receipt)+'" alt="">':'<span>영수증 없음</span>')+'</div><div class="gallery-meta"><div class="gallery-name">'+escapeHtml(r.merchant)+'</div><div class="gallery-price">'+money(r.amount)+'</div><div class="gallery-hint">'+escapeHtml(r.date.slice(5).replace('-','.'))+' · '+payType(r)+'</div></div></button>').join('');
    }else{
      $('transactions').className='transactions';
      $('transactions').innerHTML=groups.map(d=>{
        const rows=arr.filter(r=>r.date===d);return '<section class="day"><div class="day-head"><h3>'+escapeHtml(days[d]||d)+'</h3><div>합계 '+money(rows.reduce((v,r)=>v+r.amount,0))+'</div></div>'+rows.map(r=>'<div class="tx"><div class="tx-icon '+(r.kind==='personal'?'personal':'')+'">'+icon(r.category)+'</div><div class="tx-text"><div class="tx-merchant">'+escapeHtml(r.merchant)+'</div><div class="tx-sub">'+escapeHtml((r.time?(r.time+' · '):'')+r.category+' · '+payType(r))+'</div></div><div class="tx-num"><div class="tx-amount">−'+money(r.amount)+'</div><span class="tx-badge">'+(r.receipt?'증빙 있음':((r.count||1)+'건 미증빙'))+'</span></div>'+(r.receipt?'<button type="button" class="photo-tile" data-photo="'+escapeHtml(r.id)+'" aria-label="'+escapeHtml(r.merchant)+' 영수증 확대"><img loading="lazy" src="'+escapeHtml(r.receipt)+'" alt=""></button>':'<div class="no-photo">영수증<br>없음</div>')+'</div>').join('')+'</section>';}).join('');
    }
    document.querySelectorAll('[data-photo]').forEach(btn=>btn.addEventListener('click',()=>openFor(btn.dataset.photo)));
  }
  function openFor(id){photoRecords=filtered().filter(r=>r.receipt);photoIndex=photoRecords.findIndex(r=>r.id===id);if(photoIndex<0)return;showPhoto();$('modal').classList.remove('hidden');document.body.classList.add('no-scroll');}
  function showPhoto(){const r=photoRecords[photoIndex];if(!r)return;$('modalMerchant').textContent=r.merchant;$('modalAmount').textContent='−'+money(r.amount);$('modalDate').textContent=(days[r.date]||r.date)+' · '+(r.time||'')+' · '+payType(r);$('modalPhoto').src=r.receipt;$('modalPhoto').alt=r.merchant+' 영수증';$('imageOpen').href=r.receipt;$('modalIndex').textContent=(photoIndex+1)+' / '+photoRecords.length;$('prevPhoto').disabled=photoIndex===0;$('nextPhoto').disabled=photoIndex===photoRecords.length-1;document.querySelector('.modal-scroll').scrollTop=0;}
  function close(){ $('modal').classList.add('hidden');document.body.classList.remove('no-scroll');$('modalPhoto').removeAttribute('src'); }
  $('closeModal').addEventListener('click',close);
  $('prevPhoto').addEventListener('click',()=>{if(photoIndex>0){photoIndex--;showPhoto();}});
  $('nextPhoto').addEventListener('click',()=>{if(photoIndex<photoRecords.length-1){photoIndex++;showPhoto();}});
  document.addEventListener('keydown',e=>{if($('modal').classList.contains('hidden'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')$('prevPhoto').click();if(e.key==='ArrowRight')$('nextPhoto').click();});
  document.querySelectorAll('#accountTabs [data-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kind;document.querySelectorAll('#accountTabs button').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-selected',String(on));});draw();}));
  document.querySelectorAll('#dateTabs [data-date]').forEach(b=>b.addEventListener('click',()=>{date=b.dataset.date;document.querySelectorAll('#dateTabs button').forEach(x=>x.classList.toggle('active',x===b));draw();}));
  const setMode=(m)=>{mode=m;for(const [btn,key] of [[$('listMode'),'list'],[$('galleryMode'),'gallery']]){btn.classList.toggle('active',key===m);btn.setAttribute('aria-pressed',String(key===m));}draw();};
  $('listMode').addEventListener('click',()=>setMode('list'));$('galleryMode').addEventListener('click',()=>setMode('gallery'));
  draw();
})();
