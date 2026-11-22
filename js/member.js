(function(){
const M=window.TSA_MEMBER||{};if(!M.liffId)return;
const $=s=>document.querySelector(s);
const LS={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const page=document.documentElement.dataset.page||'';
let profile=null;
function btn(){
  const a=$('.header-actions');if(!a||$('.member-btn'))return;
  const b=document.createElement('button');b.className='member-btn is-out';b.type='button';b.setAttribute('aria-label','เข้าสู่ระบบด้วย LINE');b.title='เข้าสู่ระบบด้วย LINE';b.innerHTML='Log in';
  a.insertBefore(b,a.firstChild);
  const pop=document.createElement('div');pop.className='member-pop';pop.hidden=true;document.body.appendChild(pop);
  b.onclick=()=>{ if(!window.liff||!liff.isLoggedIn()){login();return;} pop.hidden=!pop.hidden; };
  document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!b.contains(e.target))pop.hidden=true});
}
function login(){ if(window.liff) liff.login({redirectUri:location.href}); }
function paint(){
  const b=$('.member-btn'),pop=$('.member-pop');if(!b)return;
  if(profile){
    b.classList.remove('is-out');b.classList.add('icon-button');b.setAttribute('aria-label','บัญชีสมาชิก');b.title=profile.displayName||'สมาชิก';b.innerHTML=profile.pictureUrl?`<img class="member-av" src="${profile.pictureUrl}" alt="">`:'<span class="member-ico">●</span>';
    const last=LS.get('tsa-last');
    pop.innerHTML=`<p class="member-hi">สวัสดี <b></b></p>${last?`<a class="member-resume" href="chapter.html?n=${last.n}">อ่านต่อ ตอนที่ ${last.n} →</a>`:''}<p class="member-note">${M.api?'ระบบจำตอนที่อ่านไว้ให้ทุกเครื่องที่ล็อกอิน':'เชื่อมบัญชีแล้ว'}</p><button type="button" class="member-out">ออกจากระบบ</button>`;
    pop.querySelector('b').textContent=profile.displayName||'';
    pop.querySelector('.member-out').onclick=()=>{liff.logout();location.reload();};
  }
  const r=$('#resume-login');if(r)r.hidden=!!profile;
}
async function api(path,body){
  if(!M.api)return null;
  const t=liff.getAccessToken();if(!t)return null;
  const res=await fetch(M.api+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({token:t},body||{}))});
  return res.ok?res.json():null;
}
async function sync(){
  const local=LS.get('tsa-last');
  if(page==='chapter'&&local){ await api('/progress',local); return; }
  const remote=await api('/get');
  if(remote&&remote.n&&(!local||(remote.ts||0)>(local.ts||0))){ LS.set('tsa-last',remote); if(window.resumeUI)resumeUI(); paint(); }
  else if(local&&(!remote||(local.ts||0)>(remote.ts||0))) api('/progress',local);
}
function hero(){
  const r=$('#resume');if(!r||$('#resume-login'))return;
  const a=document.createElement('a');a.id='resume-login';a.className='resume-login';a.href='#';a.innerHTML='<span class="line-dot">LINE</span> เข้าสู่ระบบด้วย LINE ให้จำตอนที่อ่านไว้ทุกเครื่อง';
  a.onclick=e=>{e.preventDefault();login();};r.parentNode.insertBefore(a,r.nextSibling);
}

// ---- comments ----
const epN=page==='chapter'?parseInt(new URLSearchParams(location.search).get('n'),10):0;
const cSlug=t=>String(t||'').toUpperCase().normalize('NFKC').replace(/[’'`]/g,'').replace(/[^A-Z0-9\u0E00-\u0E7F]+/g,'-').replace(/^-+|-+$/g,'').slice(0,140);
const cKey=(()=>{const c=((window.SACRED_DATA||{}).chapters||[]).find(x=>x.n===epN);return c?cSlug(c.title):'';})();
let mine={admin:false,ids:[]};
function ago(ts){const d=(Date.now()-ts)/1000;if(d<60)return 'เมื่อสักครู่';if(d<3600)return Math.floor(d/60)+' นาทีที่แล้ว';if(d<86400)return Math.floor(d/3600)+' ชั่วโมงที่แล้ว';if(d<86400*30)return Math.floor(d/86400)+' วันที่แล้ว';return new Date(ts).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});}
function cItem(c){const li=document.createElement('li');li.className='c-item';li.dataset.id=c.id;
 li.innerHTML='<div class="c-av"></div><div class="c-main"><p class="c-head"><b></b><span></span></p><p class="c-text"></p></div>';
 const av=li.querySelector('.c-av');if(c.pic){const im=document.createElement('img');im.src=c.pic;im.alt='';av.appendChild(im);}else av.textContent=(c.name||'?').slice(0,1);
 li.querySelector('b').textContent=c.name;li.querySelector('.c-head span').textContent=ago(c.ts);li.querySelector('.c-text').textContent=c.text;
 if(mine.admin||mine.ids.includes(c.id)){const d=document.createElement('button');d.type='button';d.className='c-del';d.textContent='ลบ';d.onclick=async()=>{{d.disabled=true;const r=await fetch(M.api+'/comments/del',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:liff.getAccessToken(),key:cKey,ep:epN,id:c.id})});if(r.ok)li.remove();else d.disabled=false;}};li.querySelector('.c-head').appendChild(d);}
 return li;}
async function cLoad(){const L=$('#c-list');if(!L)return;try{const r=await fetch(M.api+'/comments?key='+encodeURIComponent(cKey)+'&ep='+epN);const a=r.ok?await r.json():[];L.innerHTML='';a.forEach(c=>L.appendChild(cItem(c)));$('#c-count').textContent=a.length?'('+a.length+')':'';$('#c-empty').hidden=!!a.length;}catch(e){}}
function cForm(){const F=$('#c-form');if(!F)return;
 if(!profile){F.innerHTML='<button type="button" class="resume-login c-login"><span class="line-dot">LINE</span> เข้าสู่ระบบด้วย LINE เพื่อแสดงความคิดเห็น</button>';F.querySelector('button').onclick=login;return;}
 F.innerHTML='<div class="c-me"><img alt=""><b></b></div><textarea maxlength="600" rows="3" placeholder="คิดยังไงกับตอนนี้ เล่าให้ฟังหน่อย"></textarea><div class="c-actions"><span class="c-msg"></span><button type="button" class="button primary c-post">ส่งความคิดเห็น</button></div>';
 F.querySelector('img').src=profile.pictureUrl||'';F.querySelector('b').textContent=profile.displayName||'';
 const ta=F.querySelector('textarea'),bt=F.querySelector('.c-post'),msg=F.querySelector('.c-msg');
 bt.onclick=async()=>{const t=ta.value.trim();if(!t)return;bt.disabled=true;msg.textContent='';
  try{const r=await fetch(M.api+'/comments/add',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:liff.getAccessToken(),key:cKey,ep:epN,text:t})});
   if(r.status===429)msg.textContent='รอสักครู่ค่อยส่งใหม่นะคะ';else if(!r.ok)msg.textContent='ส่งไม่สำเร็จ ลองใหม่อีกครั้ง';else{const c=await r.json();mine.ids.push(c.id);$('#c-list').appendChild(cItem(c));$('#c-empty').hidden=true;ta.value='';}
  }catch(e){msg.textContent='ส่งไม่สำเร็จ ลองใหม่อีกครั้ง';}bt.disabled=false;};}
async function cMine(){try{const r=await fetch(M.api+'/comments/mine',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:liff.getAccessToken(),key:cKey,ep:epN})});if(r.ok){mine=await r.json();cLoad();}}catch(e){}}
async function whoami(){if(location.hash!=='#admin'||!profile)return;try{const r=await fetch(M.api+'/whoami',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:liff.getAccessToken()})});const j=await r.json();const p=$('.member-pop');if(p&&j.uid){const x=document.createElement('p');x.className='member-note';x.textContent='User ID: '+j.uid;p.appendChild(x);p.hidden=false;}}catch(e){}}
if(epN&&M.api&&$('#comments')){$('#comments').hidden=false;cLoad();cForm();}
btn();hero();
const s=document.createElement('script');s.src='https://static.line-scdn.net/liff/edge/2/sdk.js';
s.onload=async()=>{try{await liff.init({liffId:M.liffId});if(liff.isLoggedIn()){profile=await liff.getProfile();paint();sync();if(epN&&M.api){cForm();cMine();}whoami();if(window.fbq&&!LS.get('tsa-reg')){fbq('track','CompleteRegistration');LS.set('tsa-reg',1);}}else paint();}catch(e){console.warn('liff',e);paint();}};
document.head.appendChild(s);
})();
