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
 $('#cta-notes').innerHTML=notes.map(v=>`<span>${safe(v)}</span>`).join('');$('#cta-note-type').textContent=noteType;
 $('#cta-button').href=data.chatUrl;
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
function renderFragrances(){
 const mount=$('#scent-list');if(!mount)return;
 const toc=document.getElementById('scent-toc');if(toc){toc.innerHTML=`<div class="scent-toc-head"><span>INDEX · สารบัญกลิ่น</span><span>${data.scents.length} SCENTS</span></div><ol>${data.scents.map(s=>`<li><a href="#${safe(s.id)}"><span class="toc-code">${safe(s.tag)}</span><span><span class="toc-name">${safe(s.name)}</span><span class="toc-thai">${safe(s.thai)}</span></span><span class="toc-arrow" aria-hidden="true">↓</span></a></li>`).join('')}</ol>`;}
 mount.innerHTML=data.scents.map((s,i)=>`<article class="scent-card" id="${safe(s.id)}">
   <div class="scent-art" data-tone="${i}"><div class="mini-flacon" aria-hidden="true"><strong>WHITE</strong><em>theory</em><span>${safe(s.name)}</span></div></div>
   <div class="scent-content"><div><div class="scent-code">SCENT FILE / ${String(i+1).padStart(2,'0')} · ${safe(s.tag)}</div><h2>${safe(s.name)}</h2><h3>${safe(s.thai)}</h3></div>
    <p>${safe(s.desc)}</p>
    <div class="note-tags">${s.notes.length?s.notes.map(n=>`<span>${safe(n)}</span>`).join(''):``}</div>
    <p class="cta-note-type">${safe(s.note_type)}</p>
    <div class="scent-bottom"><small>READ THE STORY ↗</small><a class="to-toc" href="#scent-toc">↑ สารบัญกลิ่น</a><div class="related-chapters">${s.chapters.map(n=>`<a href="${chapterHref(n)}">ตอนที่ ${n}</a>`).join('')}</div></div></div>
  </article>`).join('');
}
if(page==='contents')renderToc();
if(page==='chapter')renderChapter();
if(page==='fragrances')renderFragrances();
})();
