/* Home: latest reader comments across all episodes (from the member Worker). */
(function(){
var M=window.TSA_MEMBER||{},box=document.getElementById('latest-comments');
if(!box||!M.api)return;
function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function ago(ts){var s=(Date.now()-ts)/1000;if(s<90)return'เมื่อสักครู่';if(s<3600)return Math.round(s/60)+' นาทีที่แล้ว';if(s<86400)return Math.round(s/3600)+' ชม.ที่แล้ว';if(s<86400*30)return Math.round(s/86400)+' วันที่แล้ว';var d=new Date(ts);return d.getDate()+'/'+(d.getMonth()+1)+'/'+(d.getFullYear()+543);}
function title(n){var d=window.SACRED_DATA||{},c=(d.chapters||[]).find(function(x){return x.n===n;});return c?c.title:'';}
fetch(M.api+'/comments/latest?limit=4').then(function(r){return r.ok?r.json():[];}).then(function(list){
  if(!Array.isArray(list)||!list.length)return;
  box.querySelector('.lc-list').innerHTML=list.map(function(c){var t=title(c.ep);return '<a class="lc-row" href="chapter.html?n='+c.ep+'#comments">'+(c.pic?'<img class="lc-pic" src="'+esc(c.pic)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="lc-pic lc-blank">'+esc((c.name||'?').slice(0,1))+'</span>')+'<span class="lc-body"><span class="lc-meta"><b>'+esc(c.name)+'</b> · ตอนที่ '+c.ep+(t?' '+esc(t):'')+'</span><span class="lc-text">'+esc(c.text)+'</span><span class="lc-time">'+ago(c.ts)+'</span></span></a>';}).join('');
  box.hidden=false;
}).catch(function(){});
})();
