/* Meta Pixel with PDPA consent. Loads only after the visitor accepts. */
(function(){
'use strict';
var PIXEL_ID=window.TSA_PIXEL_ID; if(!PIXEL_ID) return;
var KEY='tsa-consent';
function get(){try{return localStorage.getItem(KEY)}catch(e){return null}}
function set(v){try{localStorage.setItem(KEY,v)}catch(e){}}
function track(){
  var d=window.SACRED_DATA, path=location.pathname, n=Number(new URLSearchParams(location.search).get('n'));
  if(/chapter\.html$/.test(path)&&d&&n){
    var c=(d.chapters||[]).find(function(x){return x.n===n});
    var s=(d.scents||[]).find(function(x){return (x.chapters||[]).indexOf(n)>=0});
    fbq('track','ViewContent',{content_type:'episode',content_ids:['ep'+n],content_name:c?c.title:'ep'+n,content_category:s?s.name:'THE SACRED ABSURD'});
  } else if(/fragrances\.html$/.test(path)){
    fbq('track','ViewContent',{content_type:'scent_index',content_name:'Scents of the absurd'});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href*="lin.ee"],a[href*="line.me"]');
    if(a) fbq('track','Contact',{content_name:document.title});
  },true);
}
function load(){
  if(window.fbq) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init',PIXEL_ID); fbq('track','PageView');
  if(document.readyState==='complete') track(); else addEventListener('load',track);
}
function banner(){
  var b=document.createElement('div'); b.className='consent-bar'; b.setAttribute('role','dialog'); b.setAttribute('aria-label','การใช้คุกกี้');
  b.innerHTML='<p>เว็บนี้ใช้คุกกี้เพื่อวัดผลและนำเสนอเนื้อหาที่ตรงใจคุณมากขึ้น <span>คุณเลือกได้ว่าจะอนุญาตหรือไม่</span></p><div><button type="button" class="consent-no">ไม่อนุญาต</button><button type="button" class="consent-yes">ยอมรับ</button></div>';
  document.body.appendChild(b); document.body.classList.add('has-consent');
  b.querySelector('.consent-yes').onclick=function(){set('yes');b.remove();document.body.classList.remove('has-consent');load();};
  b.querySelector('.consent-no').onclick=function(){set('no');b.remove();document.body.classList.remove('has-consent');};
}
var c=get();
if(c==='yes') load(); else if(c!=='no'){ if(document.body) banner(); else addEventListener('DOMContentLoaded',banner); }
})();
