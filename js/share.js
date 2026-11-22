/* Share buttons: home shares the story, chapter shares the episode (via /s/N.html for link previews). */
(function(){
var SITE='https://sacredabsurd.com/';
function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function target(kind){
  if(kind==='chapter'){var n=parseInt(new URLSearchParams(location.search).get('n'),10);if(!(n>0))return null;var d=window.SACRED_DATA||{},c=(d.chapters||[]).find(function(x){return x.n===n;});return{url:SITE+'s/'+n+'.html',text:'ตอนที่ '+n+(c?' · '+c.title:'')+' — THE SACRED ABSURD',label:'แชร์ตอนนี้'};}
  return{url:SITE,text:'THE SACRED ABSURD — แฟนตาซีคอมเมดี้ของสวรรค์ นรก แฟรี่ และน้ำหอม',label:'แชร์เรื่องนี้'};
}
function render(el){
  var t=target(el.dataset.share);if(!t)return;var u=encodeURIComponent(t.url),x=encodeURIComponent(t.text);
  var links=[['Facebook','https://www.facebook.com/sharer/sharer.php?u='+u],['LINE','https://social-plugins.line.me/lineit/share?url='+u+'&text='+x],['X','https://twitter.com/intent/tweet?url='+u+'&text='+x]];
  el.innerHTML='<span class="sh-label">'+esc(t.label)+'</span>'+(navigator.share?'<button type="button" class="sh-btn sh-native">แชร์…</button>':'')+links.map(function(l){return '<a class="sh-btn" target="_blank" rel="noopener" href="'+l[1]+'">'+l[0]+'</a>';}).join('')+'<button type="button" class="sh-btn sh-copy">คัดลอกลิงก์</button>';
  var nb=el.querySelector('.sh-native');if(nb)nb.onclick=function(){navigator.share({title:t.text,text:t.text,url:t.url}).catch(function(){});};
  el.querySelector('.sh-copy').onclick=function(e){var b=e.currentTarget;(navigator.clipboard?navigator.clipboard.writeText(t.url):Promise.reject()).then(function(){b.textContent='คัดลอกแล้ว ✓';},function(){window.prompt('คัดลอกลิงก์นี้',t.url);});setTimeout(function(){b.textContent='คัดลอกลิงก์';},2000);};
  el.hidden=false;
}
function go(){Array.prototype.forEach.call(document.querySelectorAll('.share-bar[data-share]'),render);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
