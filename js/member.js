(function(){
const M=window.TSA_MEMBER||{};if(!M.liffId)return;
const $=s=>document.querySelector(s);
const LS={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const page=document.body.dataset.page||'';
let profile=null;
function btn(){
  const a=$('.header-actions');if(!a||$('.member-btn'))return;
  const b=document.createElement('button');b.className='icon-button member-btn';b.type='button';b.setAttribute('aria-label','สมาชิก');b.title='สมาชิก';b.innerHTML='<span class="member-ico">◉</span>';
  a.insertBefore(b,a.firstChild);
  const pop=document.createElement('div');pop.className='member-pop';pop.hidden=true;document.body.appendChild(pop);
  b.onclick=()=>{ if(!window.liff||!liff.isLoggedIn()){login();return;} pop.hidden=!pop.hidden; };
  document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!b.contains(e.target))pop.hidden=true});
}
function login(){ if(window.liff) liff.login({redirectUri:location.href}); }
function paint(){
  const b=$('.member-btn'),pop=$('.member-pop');if(!b)return;
  if(profile){
    b.innerHTML=profile.pictureUrl?`<img class="member-av" src="${profile.pictureUrl}" alt="">`:'<span class="member-ico">●</span>';
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
btn();hero();
const s=document.createElement('script');s.src='https://static.line-scdn.net/liff/edge/2/sdk.js';
s.onload=async()=>{try{await liff.init({liffId:M.liffId});if(liff.isLoggedIn()){profile=await liff.getProfile();paint();sync();if(window.fbq&&!LS.get('tsa-reg')){fbq('track','CompleteRegistration');LS.set('tsa-reg',1);}}else paint();}catch(e){console.warn('liff',e);paint();}};
document.head.appendChild(s);
})();
