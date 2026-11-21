/* Lightbox: tap a cast card, gallery, day strip or chapter illustration to see the full image. */
(function(){
var SEL='.cast-card img,.gal-strip img,.day-strip img,#chapter-illustration-slot img,.cover-frame img.hero-photo';
var box,img,cap,list=[],idx=0,startX=null;
function build(){
  box=document.createElement('div');box.className='lb';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','ดูรูปเต็ม');box.hidden=true;
  box.innerHTML='<button type="button" class="lb-close" aria-label="ปิด">×</button><button type="button" class="lb-nav lb-prev" aria-label="รูปก่อนหน้า">‹</button><figure class="lb-fig"><img alt=""><figcaption></figcaption></figure><button type="button" class="lb-nav lb-next" aria-label="รูปถัดไป">›</button>';
  document.body.appendChild(box);img=box.querySelector('img');cap=box.querySelector('figcaption');
  box.addEventListener('click',function(e){if(e.target===box||e.target.classList.contains('lb-fig')||e.target.classList.contains('lb-close'))close();});
  box.querySelector('.lb-prev').onclick=function(e){e.stopPropagation();go(-1);};
  box.querySelector('.lb-next').onclick=function(e){e.stopPropagation();go(1);};
  box.addEventListener('touchstart',function(e){startX=e.touches[0].clientX;},{passive:true});
  box.addEventListener('touchend',function(e){if(startX==null)return;var dx=e.changedTouches[0].clientX-startX;startX=null;if(Math.abs(dx)>50)go(dx<0?1:-1);});
}
function label(el){var f=el.closest('figure');var s=f&&f.querySelector('figcaption strong');var t=f&&f.querySelector('figcaption span');return s?(s.textContent+(t?' · '+t.textContent:'')):(el.alt||'');}
function show(){var el=list[idx];img.src=el.currentSrc||el.src;img.alt=el.alt||'';cap.textContent=label(el);cap.hidden=!cap.textContent;var many=list.length>1;box.querySelector('.lb-prev').hidden=!many;box.querySelector('.lb-next').hidden=!many;}
function go(d){idx=(idx+d+list.length)%list.length;show();}
function open(el){if(!box)build();var g=el.closest('.cast-grid,.gal-strip,.day-strip');list=g?Array.prototype.slice.call(g.querySelectorAll('img')):[el];idx=Math.max(0,list.indexOf(el));show();box.hidden=false;document.documentElement.classList.add('lb-open');box.querySelector('.lb-close').focus();}
function close(){box.hidden=true;img.removeAttribute('src');document.documentElement.classList.remove('lb-open');}
document.addEventListener('click',function(e){if(!e.target.closest)return;var el=e.target.closest(SEL);if(!el){var c=e.target.closest('.cast-card');el=c&&c.querySelector('img');}if(!el)return;if(el.closest('a'))return;e.preventDefault();open(el);});
document.addEventListener('keydown',function(e){if(!box||box.hidden)return;if(e.key==='Escape')close();else if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);});
})();
