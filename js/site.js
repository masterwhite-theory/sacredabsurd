/* THE SACRED ABSURD — no framework, no build, no server.
   GitHub Pages compatible. data.js holds every ACT and chapter entry.
*/
(function(){
'use strict';
const data=window.SACRED_DATA;
if(!data){console.error('Missing js/data.js');return;}
const root=document.documentElement;
const $=sel=>document.querySelector(sel);
const $$=sel=>Array.from(document.querySelectorAll(sel));
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
const savedTheme=store.get('tsa-theme');
root.dataset.theme=savedTheme==='dark'||savedTheme==='light'?savedTheme:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function syncTheme(){ $$('.theme-symbol').forEach(x=>x.textContent=root.dataset.theme==='dark'?'☼':'☾'); $$('.theme-toggle').forEach(x=>x.setAttribute('aria-label',root.dataset.theme==='dark'?'เปลี่ยนเป็นโหมดสว่าง':'เปลี่ยนเป็นโหมดมืด'));}
syncTheme();
$$('.theme-toggle').forEach(btn=>btn.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';store.set('tsa-theme',root.dataset.theme);syncTheme();}));
const menuBtn=$('.mobile-menu-button'),mobileMenu=$('#mobile-menu');
if(menuBtn&&mobileMenu){menuBtn.addEventListener('click',()=>{const next=menuBtn.getAttribute('aria-expanded')!=='true';menuBtn.setAttribute('aria-expanded',String(next));mobileMenu.hidden=!next;});document.addEventListener('keydown',e=>{if(e.key==='Escape'){mobileMenu.hidden=true;menuBtn.setAttribute('aria-expanded','false')}})}
$$('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
const page=root.dataset.page;
const chapterHref=n=>`chapter.html?n=${encodeURIComponent(n)}`;
const byNumber=new Map(data.chapters.map(c=>[c.n,c]));
function romanToId(roman){return 'act-'+roman.toLowerCase()}

/* 30-ACT searchable accordion index */
function renderToc(){
 const mount=$('#act-list');if(!mount)return;
 mount.innerHTML=data.acts.map((a,i)=>`<details class="act-group" id="${romanToId(a.roman)}" ${i===0?'open':''}>
   <summary class="act-header"><span class="act-number">${safe(a.roman)}</span>
      <span class="act-summary-text"><span class="act-heading">${safe(a.title)}</span><span class="act-desc" style="display:block">${safe(a.description)}</span></span>
      <span class="act-summary-right"><small>${a.chapters.length} EP.</small><span class="act-toggle" aria-hidden="true">＋</span></span>
   </summary>
   <ol class="episode-list">${a.chapters.map(c=>{
     const tags=[];if(c.demo_content)tags.push('มีหน้าอ่านตัวอย่าง');if(c.status==='working')tags.push('WORKING');if(/SPECIAL/.test(a.title))tags.push('SPECIAL');
     return `<li class="episode-item" data-search="${safe((c.n+' '+c.title+' '+c.teaser).toLocaleLowerCase())}"><a href="${chapterHref(c.n)}"><span class="episode-no">${String(c.n).padStart(3,'0')}</span><span><span class="episode-name">${safe(c.title)}</span><span class="episode-teaser" style="display:block">${safe(c.short)}</span>${tags.length?`<span class="chapter-flags">${tags.map(t=>`<span>${t}</span>`).join('')}</span>`:''}</span><span class="episode-arrow" aria-hidden="true">↗</span></a></li>`
   }).join('')}</ol></details>`).join('');
 const search=$('#chapter-search'),toggleAll=$('#toggle-all'),counter=$('#search-count'),empty=$('#no-results');
 const groups=$$('.act-group');
 let isAllOpen=false;
 function applyFilter(){
   const term=(search.value||'').trim().toLocaleLowerCase();let visible=0;
   groups.forEach((g,i)=>{
     const heading=data.acts[i];const actMatch=[heading.roman,heading.title,heading.description].join(' ').toLocaleLowerCase().includes(term);
     let actVisible=0;
     g.querySelectorAll('.episode-item').forEach(li=>{const match=!term||actMatch||li.dataset.search.includes(term);li.hidden=!match;if(match){actVisible++;visible++;}});
     g.hidden=actVisible===0;
     if(term&&actVisible>0)g.open=true;
     if(!term)g.open=i===0||isAllOpen;
   });
   counter.textContent=visible+' ตอน';empty.hidden=visible!==0;
 }
 search.addEventListener('input',applyFilter);
 toggleAll.addEventListener('click',()=>{isAllOpen=!isAllOpen;groups.filter(g=>!g.hidden).forEach(g=>g.open=isAllOpen);toggleAll.textContent=isAllOpen?'ย่อทั้งหมด −':'ขยายทั้งหมด ＋'});
 if(location.hash){const el=document.getElementById(location.hash.slice(1));if(el){el.open=true;setTimeout(()=>el.scrollIntoView({block:'start'}),80)}}
 }

/* chapter viewer */
async function renderChapter(){
 const mount=$('#chapter-body');if(!mount)return;
 const params=new URLSearchParams(location.search),parsed=Number(params.get('n'));
 const n=Number.isInteger(parsed)&&parsed>=1&&parsed<=data.published?parsed:1;
 const chapter=byNumber.get(n);
 if(!chapter){mount.textContent='ไม่มีตอนนี้ในสารบัญ';return;}
 const act=data.acts.find(a=>a.roman===chapter.act);
 let scene=null;try{const r=await fetch(`ep/${String(n).padStart(3,'0')}.json`);if(r.ok)scene=await r.json();}catch(e){}
 $('#chapter-eyebrow').textContent=`ACT ${chapter.act} · ตอนที่ ${String(n).padStart(3,'0')}`;
 $('#chapter-title').textContent=chapter.title;
 $('#chapter-thai').textContent='';$('#chapter-thai').hidden=true;
 $('#chapter-subtitle').textContent=scene?.subtitle||'';
 $('#chapter-quote').textContent=scene?.quote||'';$('#chapter-quote').hidden=!scene?.quote;
 document.title=`ตอนที่ ${n} — ${chapter.title} | THE SACRED ABSURD`;
 const status=$('#chapter-status');
 status.textContent='';status.hidden=true;
 const illustration=$('#chapter-illustration-slot');const img=data.images[String(n)];illustration.hidden=!img;if(img){const im=illustration.querySelector('img');im.src=img;im.alt=chapter.title;im.removeAttribute('width');im.removeAttribute('height');const cap=illustration.querySelector('figcaption');if(cap)cap.remove();}
 if(scene){
   const blocks=scene.blocks.map(b=>{
     switch(b.type){
       case 'scene':return `<h2 class="scene-heading">${safe(b.text)}</h2>`;
       case 'p':return `<p>${safe(b.text)}</p>`;
       case 'dialogue':return `<p class="dialogue"><strong class="dialogue-name">${safe(b.who)}:</strong> <span class="dialogue-words">“${safe(b.text)}”</span></p>`;
       case 'thought':return `<p class="thought"><em>${safe(b.text)}</em></p>`;
       case 'ornament':return '<div class="ornament" aria-hidden="true">✦</div>';
       case 'ending':return `<p class="ending">${safe(b.text)}</p>`;
       default:return '';
     }
   }).join('');
   mount.innerHTML=blocks;
 }else{
   mount.innerHTML=`<h2 class="scene-heading">I. THE STORY CONTINUES</h2>
     <div class="missing-copy"><h3>Coming to the reading room.</h3><p>ตอนที่ ${String(n).padStart(3,'0')} — ${safe(chapter.title)}</p><p>ข้อมูลชื่อและคำโปรยนำมาจากสารบัญต้นฉบับแล้ว แต่ยังไม่ได้วางเนื้อหาเต็มในชุดเทมเพลตนี้</p><a href="contents.html#${romanToId(chapter.act)}">กลับไปเลือกตอนใน ACT ${safe(chapter.act)} ↗</a></div>`;
 }
 const fragrance=data.scents.find(s=>s.chapters.includes(n));
 let ctaName='THE SACRED ABSURD COLLECTION',ctaDesc='ทุกเรื่องในจักรวาลนี้เกิดจากกลิ่น อยากดมตัวจริง ทักแชทมาคุยกับนักปรุงได้เลย',notes=[],noteType='';
 if(fragrance){ctaName=fragrance.name;ctaDesc=fragrance.desc;notes=fragrance.notes;noteType=fragrance.note_type;}
 $('#cta-name').textContent=ctaName;$('#cta-desc').textContent=ctaDesc;
 $('#cta-notes').className='';$('#cta-notes').innerHTML=fragrance?notesHtml(fragrance)+priceHtml(fragrance):'';if(fragrance&&fragrance.available)$('#cta-button').hidden=true;$('#cta-note-type').textContent=noteType;
 $('#cta-button').href=lineMsg(`สวัสดีค่ะ มาจากเว็บนิยาย sacredabsurd.com\nอ่านตอนที่ ${n}: ${chapter.title}\n`+(fragrance?`สนใจกลิ่น: ${fragrance.name} (${fragrance.tag})`:'อยากสอบถามกลิ่นค่ะ'));
 const prev=$('#previous-chapter'),next=$('#next-chapter');
 function setupNav(el,id,word){
    const c=byNumber.get(id);if(!c){el.setAttribute('aria-disabled','true');el.href='contents.html';el.querySelector('span').textContent='—';return;}
    el.href=chapterHref(id);el.querySelector('span').textContent=`${String(id).padStart(3,'0')} · ${c.title}`;
    el.setAttribute('aria-label',`${word} ตอนที่ ${id} ${c.title}`);
 }
 setupNav(prev,n-1,'ตอนก่อนหน้า');setupNav(next,n+1,'ตอนถัดไป');
 applyFontSize();
 const progress=$('#reading-progress');
 let scheduled=false;
 function updateProgress(){
   const scrollable=document.documentElement.scrollHeight-innerHeight;
   const pct=scrollable>0?Math.max(0,Math.min(100,Math.round((scrollY/scrollable)*100))):100;
   progress.style.width=pct+'%';progress.setAttribute('aria-valuenow',String(pct));scheduled=false;
 }
 addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress)}},{passive:true});
 addEventListener('resize',updateProgress);updateProgress();
 }
let currentFontSize=Number(store.get('tsa-font-size'))||19;
function applyFontSize(next=currentFontSize){
 currentFontSize=Math.min(26,Math.max(16,next));
 root.style.setProperty('--reader-font-size',currentFontSize+'px');
 const label=$('#type-level');if(label)label.textContent=Math.round(currentFontSize/19*100)+'%';
 return currentFontSize;
}
const minus=$('#font-decrease'),plus=$('#font-increase');
if(minus&&plus){minus.addEventListener('click',()=>{applyFontSize(currentFontSize-1);store.set('tsa-font-size',currentFontSize)});plus.addEventListener('click',()=>{applyFontSize(currentFontSize+1);store.set('tsa-font-size',currentFontSize)});}
/* scent index */
 function lineMsg(t){return data.lineId?`https://line.me/R/oaMessage/${encodeURIComponent(data.lineId)}/?${encodeURIComponent(t)}`:data.chatUrl;}
 function fixChatLinks(t){document.querySelectorAll('a[href="'+data.chatUrl+'"]').forEach(a=>a.href=lineMsg(t||'สวัสดีค่ะ มาจากเว็บ sacredabsurd.com'));}
 function notesHtml(s){
   if(s&&s.pyramid){return `<div class="note-pyramid">${Object.entries(s.pyramid).map(([k,v])=>`<div class="note-row"><b>${safe(k)}</b><span>${v.map(safe).join(' · ')}</span></div>`).join('')}</div>`;}
   const n=(s&&s.notes)||[];return n.length?`<div class="note-tags">${n.map(x=>`<span>${safe(x)}</span>`).join('')}</div>`:'';
 }
 function boardHtml(s){return s&&s.board?`<a class="board-link" href="${safe(s.board)}" target="_blank" rel="noopener">ดู Concept Board ↗</a>`:'';}
 function priceHtml(s){
   if(s&&!s.available&&s.image)return `${boardHtml(s)}<p class="soon-note">✦ กำลังพัฒนาสูตร · <a href="${lineMsg(`สวัสดีค่ะ มาจากเว็บ sacredabsurd.com\nขอรับแจ้งเมื่อเปิดขายกลิ่น: ${s.name} (${s.tag})`)}" target="_blank" rel="noopener">ทัก LINE เพื่อรับแจ้งเมื่อเปิดขาย</a></p>`;
   if(!s||!s.available||!data.pricing||!data.pricing.length)return '';
   return `<div class="price-box">${buyBox(s)}${data.promo&&data.promo.length?`<ul class="promo-list">${data.promo.map(x=>`<li>${safe(x)}</li>`).join('')}</ul>`:''}${boardHtml(s)}</div>`;
 }
 /* ---- cart ---- */
 const CART_KEY='tsa-cart';
 function cartGet(){try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(e){return []}}
 function cartSet(c){try{localStorage.setItem(CART_KEY,JSON.stringify(c))}catch(e){} cartRender();}
 const baht=v=>'฿'+Math.round(v).toLocaleString('en-US');
 function lineTotal(it){const base=it.price*it.qty;return /^100/.test(it.size)?base*0.85:base;}
 function perks(it){const x=it.qty>1?' ×'+it.qty:'';const p=[];if(/^50/.test(it.size))p.push('แถม 15 ml'+x);if(/^100/.test(it.size))p.push('ลด 15% + แถม 15 ml'+x);return p.join(' · ');}
 function cartMsg(c){
   let t='สวัสดีค่ะ สั่งจากเว็บ sacredabsurd.com\nรายการสั่งซื้อ:\n';let sum=0;
   c.forEach((it,i)=>{const lt=lineTotal(it);sum+=lt;t+=`${i+1}) ${it.name} (${it.tag}) ${it.size} x${it.qty} = ${baht(lt)}${perks(it)?' ['+perks(it)+']':''}\n`;});
   t+=`รวมโดยประมาณ ${baht(sum)}\nส่งฟรี + ของที่ระลึก + ตัวอย่างกลิ่น 2 ml อีก 2 กลิ่น`;return t;
 }
 function scentById(id){return (data.scents||[]).find(x=>x.tag===id);}
 function buyBox(s){
   const uid=s.tag+'-'+Math.random().toString(36).slice(2,7);
   return `<div class="buy-box" data-sid="${safe(s.tag)}"><div class="size-pick" role="radiogroup" aria-label="เลือกขนาด">${data.pricing.map(([z,p],i)=>`<label class="size-opt"><input type="radio" name="sz-${uid}" value="${i}" ${i===2?'checked':''}><span>${safe(z)}<b>฿${Number(p).toLocaleString('en-US')}</b></span></label>`).join('')}</div>
   <div class="qty-row"><span class="qty-label">จำนวน</span><div class="qty"><button type="button" data-q="-1" aria-label="ลด">−</button><output>1</output><button type="button" data-q="1" aria-label="เพิ่ม">+</button></div></div>
   <div class="buy-actions"><button type="button" class="button outline add-cart">ใส่ตะกร้า</button><button type="button" class="button primary buy-now">สั่งเลยทาง LINE ↗</button></div></div>`;
 }
 function readBox(box){const s=scentById(box.dataset.sid);const i=Number((box.querySelector('input:checked')||{}).value||0);const qty=Number(box.querySelector('output').textContent)||1;const [size,price]=data.pricing[i];return {tag:s.tag,name:s.name,size,price,qty};}
 function cartUI(){
   if(document.getElementById('cart-fab'))return;
   const fab=document.createElement('button');fab.id='cart-fab';fab.type='button';fab.className='cart-fab';fab.setAttribute('aria-label','ตะกร้าสินค้า');fab.innerHTML='<span class="cart-ico">🛍</span><span class="cart-count">0</span>';
   const dr=document.createElement('aside');dr.id='cart-drawer';dr.className='cart-drawer';dr.hidden=true;dr.setAttribute('aria-label','ตะกร้าสินค้า');
   document.body.append(fab,dr);
   fab.onclick=()=>{dr.hidden=!dr.hidden;};
   document.addEventListener('click',e=>{
     const q=e.target.closest('.buy-box .qty button');if(q){const o=q.parentNode.querySelector('output');o.textContent=Math.max(1,Number(o.textContent)+Number(q.dataset.q));return;}
     const add=e.target.closest('.add-cart');if(add){const it=readBox(add.closest('.buy-box'));const c=cartGet();const ex=c.find(x=>x.tag===it.tag&&x.size===it.size);if(ex)ex.qty+=it.qty;else c.push(it);cartSet(c);try{fbq('track','AddToCart',{content_ids:[it.tag],content_name:it.name,value:it.price*it.qty,currency:'THB'})}catch(err){}
       add.closest('.buy-box').querySelector('output').textContent='1';add.textContent='เพิ่มแล้ว ✓';setTimeout(()=>add.textContent='ใส่ตะกร้า',1400);fab.classList.add('bump');setTimeout(()=>fab.classList.remove('bump'),500);return;}
     const now=e.target.closest('.buy-now');if(now){const it=readBox(now.closest('.buy-box'));try{fbq('track','InitiateCheckout',{content_ids:[it.tag],value:lineTotal(it),currency:'THB'})}catch(err){}window.open(lineMsg(cartMsg([it])),'_blank');return;}
     const cq=e.target.closest('[data-cq]');if(cq){const c=cartGet();const k=Number(cq.dataset.i);c[k].qty+=Number(cq.dataset.cq);if(c[k].qty<1)c.splice(k,1);cartSet(c);return;}
     if(e.target.closest('.cart-close')){dr.hidden=true;return;}
     if(e.target.closest('.cart-clear')){cartSet([]);return;}
     if(e.target.closest('.cart-send')){const c=cartGet();if(!c.length)return;try{fbq('track','InitiateCheckout',{content_ids:c.map(x=>x.tag),value:c.reduce((a,x)=>a+lineTotal(x),0),currency:'THB'})}catch(err){}window.open(lineMsg(cartMsg(c)),'_blank');return;}
   });
   cartRender();
 }
 function cartRender(){
   const c=cartGet(),fab=document.getElementById('cart-fab'),dr=document.getElementById('cart-drawer');if(!fab)return;
   const n=c.reduce((a,x)=>a+x.qty,0);fab.querySelector('.cart-count').textContent=n;fab.classList.toggle('empty',!n);
   const sum=c.reduce((a,x)=>a+lineTotal(x),0);
   dr.innerHTML=`<div class="cart-head"><b>ตะกร้าสินค้า</b><button type="button" class="cart-close" aria-label="ปิด">✕</button></div>`+
   (c.length?`<ul class="cart-list">${c.map((it,i)=>`<li><div><strong>${safe(it.name)}</strong><small>${safe(it.tag)} · ${safe(it.size)} · ${baht(it.price)}${perks(it)?' · '+perks(it):''}</small></div><div class="qty"><button type="button" data-cq="-1" data-i="${i}">−</button><output>${it.qty}</output><button type="button" data-cq="1" data-i="${i}">+</button></div><span class="cart-lt">${baht(lineTotal(it))}</span></li>`).join('')}</ul>
   <div class="cart-sum"><span>รวมโดยประมาณ</span><b>${baht(sum)}</b></div><p class="cart-perk">ส่งฟรีทุกออเดอร์ · ของที่ระลึก + ตัวอย่างกลิ่น 2 ml อีก 2 กลิ่น</p>
   <button type="button" class="button primary cart-send">ส่งคำสั่งซื้อทาง LINE ↗</button><button type="button" class="cart-clear">ล้างตะกร้า</button><p class="cart-note">แอดมินจะยืนยันยอดและที่อยู่จัดส่งในแชท</p>`:`<p class="cart-empty">ยังไม่มีสินค้าในตะกร้า<br><a href="fragrances.html">เลือกกลิ่น ↗</a></p>`);
 }

function renderFragrances(){
 const mount=$('#scent-list');if(!mount)return;
 const toc=document.getElementById('scent-toc');if(toc){toc.innerHTML=`<div class="scent-toc-head"><span>INDEX · สารบัญกลิ่น</span><span>${data.scents.length} SCENTS</span></div><ol>${data.scents.map(s=>`<li><a href="#${safe(s.id)}"><span class="toc-code">${safe(s.tag)}</span><span><span class="toc-name">${safe(s.name)}</span><span class="toc-thai">${safe(s.thai)}</span></span><span class="toc-arrow" aria-hidden="true">↓</span></a></li>`).join('')}</ol>`;}
 mount.innerHTML=data.scents.map((s,i)=>`<article class="scent-card" id="${safe(s.id)}">
   <div class="scent-art${s.image?' has-photo':''}" data-tone="${i}">${s.image?`<img src="${safe(s.image)}" alt="${safe(s.name)}" loading="lazy">`:`<div class="mini-flacon" aria-hidden="true"><strong>WHITE</strong><em>theory</em><span>${safe(s.name)}</span></div>`}</div>
   <div class="scent-content"><div><div class="scent-code">SCENT FILE / ${String(i+1).padStart(2,'0')} · ${safe(s.tag)}</div><h2>${safe(s.name)}</h2><h3>${safe(s.thai)}</h3></div>
    <p>${safe(s.desc)}</p>
    ${notesHtml(s)}${priceHtml(s)}
    <p class="cta-note-type">${safe(s.note_type)}</p>
    <div class="scent-bottom"><small>READ THE STORY ↗</small><a class="to-toc" href="#scent-toc">↑ สารบัญกลิ่น</a><div class="related-chapters">${s.chapters.map(n=>`<a href="${chapterHref(n)}">ตอนที่ ${n}</a>`).join('')}</div></div></div>
  </article>`).join('');
}
fixChatLinks();cartUI();if(page==='contents')renderToc();
if(page==='chapter')renderChapter();
if(page==='fragrances')renderFragrances();
})();
