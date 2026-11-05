/* Deck99 art direction — shared motion engine
   Needs: gsap, ScrollTrigger, Lenis (all local in assets/vendor). Degrades to a plain page if they are missing. */
(function(){
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const root=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv=n=>getComputedStyle(root).getPropertyValue(n).trim();
const C={bg:cv('--bg'),panel:cv('--panel'),ink:cv('--ink'),muted:cv('--muted'),sec:cv('--sec'),gold:cv('--gold'),tile:cv('--tile'),deep:cv('--deep'),line:cv('--line')};
const rnd=i=>((i*9301+49297)%233280)/233280;
const pad=n=>String(n).padStart(2,'0');
const D99=window.D99={C,rnd,$,$$,reduce,lenis:null};

/* ---------- svg scene helpers (all return strings) ---------- */
const A=(i,inner)=>`<g class="a" style="--i:${i}">${inner}</g>`;
const P=(i,inner)=>`<g class="pop" style="--i:${i}">${inner}</g>`;
const L=(i,d,stroke,w=2,extra='')=>`<path class="dr" style="--i:${i}" pathLength="1" d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const T=(i,x,y,txt,o={})=>`<text class="a" style="--i:${i}" x="${x}" y="${y}" fill="${o.fill||C.muted}" font-size="${o.size||13}" ${o.anchor?`text-anchor="${o.anchor}"`:''}>${txt}</text>`;
const R=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx??0}" fill="${o.fill||'none'}" ${o.op!=null?`fill-opacity="${o.op}"`:''} ${o.stroke?`stroke="${o.stroke}" stroke-width="${o.sw||1.6}" ${o.so!=null?`stroke-opacity="${o.so}"`:''} ${o.dash?`stroke-dasharray="${o.dash}"`:''}`:''} ${o.cls?`class="${o.cls}"`:''} ${o.style?`style="${o.style}"`:''}/>`;
const PILL=(i,x,y,w,h,label,o={})=>A(i,R(x,y,w,h,{rx:h/2,fill:o.fill||C.deep,stroke:o.stroke||C.sec})+`<text x="${x+w/2}" y="${y+h/2+4.5}" text-anchor="middle" fill="${o.ink||C.ink}" font-size="${o.size||13}">${label}</text>`);
const BOX=(i,x,y,w,h,label,o={})=>A(i,R(x,y,w,h,{rx:o.rx??10,fill:o.fill||C.deep,stroke:o.stroke||C.sec,so:o.so,sw:o.sw})+`<text x="${x+(o.anchor==='start'?16:w/2)}" y="${y+(o.ty??h/2+4.5)}" ${o.anchor==='start'?'':'text-anchor="middle"'} fill="${o.ink||C.ink}" font-size="${o.size||13}">${label}</text>`+(o.sub?`<text x="${x+(o.anchor==='start'?16:w/2)}" y="${y+(o.ty??h/2+4.5)+17}" ${o.anchor==='start'?'':'text-anchor="middle"'} fill="${C.muted}" font-size="${(o.size||13)-2}">${o.sub}</text>`:''));
const DOT=(path,dur=2.4,begin=0,color=C.gold,r=4)=>`<circle r="${r}" fill="${color}"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;
const SVG=(inner,vb='0 0 480 480')=>`<svg viewBox="${vb}">${inner}</svg>`;
D99.h={A,P,L,T,R,PILL,BOX,DOT,SVG};

/* ---------- state-only engine (works without gsap) ---------- */
const hasGsap=!!(window.gsap&&window.ScrollTrigger);
if(!hasGsap)root.classList.remove('js');
if(reduce)root.classList.add('reduce');

/* mobile menu */
const menu=$('.menu'), nav=$('header.site nav');
if(menu&&nav){
  const close=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';root.style.overflow=''};
  menu.addEventListener('click',()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o);menu.textContent=o?'Close':'Menu';root.style.overflow=o?'hidden':''});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});
  addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}

/* in-view toggle for inline illustrations: [data-inview] gets .on */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{threshold:.3});
D99.inview=(sel='[data-inview]')=>$$(sel).forEach(el=>io.observe(el));

/* accordion (FAQ) */
$$('.qa').forEach(q=>{const b=$('button',q);b.setAttribute('aria-expanded',q.classList.contains('on'));
  b.addEventListener('click',()=>{const o=!q.classList.contains('on');$$('.qa',q.parentElement).forEach(x=>{x.classList.remove('on');$('button',x).setAttribute('aria-expanded','false')});if(o){q.classList.add('on');b.setAttribute('aria-expanded','true')}})});

/* sticky scrollytelling */
D99.story=function(cfg){
  const track=typeof cfg.el==='string'?$(cfg.el):cfg.el; if(!track)return;
  const vis=$('.vis',track), items=$$('.story-item',track), num=$('.vis-count b',track), rail=$('.story-rail i',track);
  const scenes=cfg.scenes.map((f,i)=>{const d=document.createElement('div');d.className='sc'+(i?'':' on');d.innerHTML=f(C,D99.h);vis.appendChild(d);return d});
  let tag=null; if(cfg.tags){tag=document.createElement('div');tag.className='vis-tag';tag.textContent=cfg.tags[0];vis.appendChild(tag)}
  let cur=0; if(rail)rail.style.transform=`scaleY(${1/items.length})`;
  const set=i=>{ if(i===cur)return; cur=i;
    items.forEach((b,k)=>{b.classList.toggle('on',k===i);k===i?b.setAttribute('aria-current','true'):b.removeAttribute('aria-current')});
    scenes.forEach((s,k)=>s.classList.toggle('on',k===i));
    if(num)num.textContent=pad(i+1); if(tag)tag.textContent=cfg.tags[i];
    if(rail)rail.style.transform=`scaleY(${(i+1)/items.length})`;
    cfg.onChange&&cfg.onChange(i);
  };
  let st=null;
  if(hasGsap)st=ScrollTrigger.create({trigger:track,start:'top top',end:'bottom bottom',onUpdate:s=>set(Math.min(items.length-1,Math.floor(s.progress*items.length)))});
  items.forEach((b,i)=>b.addEventListener('click',()=>{ st?D99.scrollTo(st.start+(st.end-st.start)*(i+.5)/items.length):set(i) }));
  return {set,st};
};

D99.scrollTo=(y,o={})=>{
  if(D99.lenis)D99.lenis.scrollTo(y,{duration:1.7,easing:t=>1-Math.pow(1-t,4),...o});
  else if(typeof y==='number')scrollTo({top:y,behavior:reduce?'auto':'smooth'});
  else scrollTo({top:y.getBoundingClientRect().top+scrollY-95,behavior:reduce?'auto':'smooth'});
};

if(!hasGsap){ D99.inview(); return; }

/* =====================================================
   MOTION (gsap present)
   ===================================================== */
gsap.registerPlugin(ScrollTrigger);
if(!reduce&&window.Lenis){
  const lenis=D99.lenis=new Lenis({lerp:.09,smoothWheel:true});
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);
}
/* same-page anchors; cross-page links are left alone */
$$('a[href*="#"]').forEach(a=>a.addEventListener('click',e=>{
  const u=new URL(a.href,location.href); if(u.pathname.replace(/index\.html$/,'')!==location.pathname.replace(/index\.html$/,'')||u.origin!==location.origin)return;
  const id=u.hash; if(!id||id==='#')return; if(id==='#top'){e.preventDefault();D99.scrollTo(0);return}
  const t=$(id); if(!t)return; e.preventDefault(); D99.lenis?D99.lenis.scrollTo(t,{offset:-70,duration:1.8,easing:t=>1-Math.pow(1-t,4)}):D99.scrollTo(t);
}));

/* progress + header */
const header=$('header.site'), prog=$('.progress');
ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{
  if(prog)gsap.set(prog,{scaleX:s.progress});
  const y=s.scroll(); if(header){header.classList.toggle('scrolled',y>40);header.classList.toggle('hide',s.direction===1&&y>500&&!(nav&&nav.classList.contains('open')))}
}});

/* word-mask split */
function split(el){
  el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
  const walk=(node,frag)=>node.childNodes.forEach(n=>{
    if(n.nodeType===3){ n.textContent.split(/(\s+)/).forEach(t=>{ if(!t)return; if(/^\s+$/.test(t)){frag.append(' ');return}
      const w=document.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');const i=document.createElement('span');i.className='wi';i.textContent=t;w.append(i);frag.append(w)})}
    else if(n.nodeName==='BR'){frag.append(n.cloneNode())}
    else{const c=n.cloneNode(false);walk(n,c);frag.append(c)}
  });
  const f=document.createDocumentFragment();walk(el,f);el.textContent='';el.append(f);return $$('.wi',el);
}
D99.split=split;
function splitFill(el){
  const label=el.textContent.trim();el.setAttribute('aria-label',label);
  el.innerHTML=label.split(/\s+/).map(w=>`<span aria-hidden="true">${w}</span>`).join(' ');return $$('span',el);
}

const heroWords=[];
if(!reduce){
  $$('[data-split]').forEach(h=>{
    const w=split(h); h.style.visibility='visible'; gsap.set(w,{yPercent:118});
    if(h.dataset.split==='hero'){heroWords.push(...w);return}
    ScrollTrigger.create({trigger:h,start:'top 88%',once:true,onEnter:()=>gsap.to(w,{yPercent:0,duration:1.3,ease:'expo.out',stagger:.07})});
  });
  $$('[data-fill]').forEach(p=>{const w=splitFill(p);
    gsap.fromTo(w,{opacity:.16},{opacity:1,ease:'none',stagger:.12,scrollTrigger:{trigger:p,start:'top 82%',end:'bottom 52%',scrub:true}})});

  /* staggered batch reveals */
  gsap.set('[data-r]',{y:34});
  ScrollTrigger.batch('[data-r]',{start:'top 92%',once:true,interval:.1,batchMax:6,
    onEnter:b=>gsap.to(b,{opacity:1,y:0,duration:1.2,ease:'expo.out',stagger:.09,overwrite:true})});

  /* image reveals + parallax */
  $$('.img-reveal').forEach(w=>{
    const inn=$('.ir-in',w),img=$('img',w); if(!inn||!img)return;
    gsap.set(inn,{scale:1.35});
    ScrollTrigger.create({trigger:w,start:'top 84%',once:true,onEnter:()=>{
      gsap.to(w,{clipPath:'inset(0 0 0% 0)',duration:1.5,ease:'expo.inOut',onComplete:()=>{w.style.clipPath='none'}});
      gsap.to(inn,{scale:1,duration:2,ease:'expo.out',onComplete:()=>{inn.style.willChange='auto'}});
    }});
    if(!w.hasAttribute('data-noparallax'))gsap.fromTo(img,{yPercent:-5},{yPercent:5,ease:'none',scrollTrigger:{trigger:w,start:'top bottom',end:'bottom top',scrub:true}});
  });

  /* magnetic buttons */
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    $$('.mag').forEach(b=>{
      const xt=gsap.quickTo(b,'x',{duration:.6,ease:'power3'}),yt=gsap.quickTo(b,'y',{duration:.6,ease:'power3'});
      b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();xt((e.clientX-r.left-r.width/2)*.28);yt((e.clientY-r.top-r.height/2)*.4)});
      b.addEventListener('pointerleave',()=>{xt(0);yt(0)});
    });
  }

  /* hero parallax */
  if($('.hero-img')){
    gsap.to('.hero-img',{yPercent:14,scale:1.08,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero-content',{y:-80,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'70% top',scrub:true}});
  }

  /* generic parallax: [data-parallax="0.15"] moves relative to scroll */
  $$('[data-parallax]').forEach(el=>{const k=parseFloat(el.dataset.parallax)||.12;
    gsap.fromTo(el,{y:()=>-k*120},{y:()=>k*120,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:true}})});

  /* count-up: <b data-count="4" data-pad="2"> */
  $$('[data-count]').forEach(el=>{const to=parseFloat(el.dataset.count),p=+el.dataset.pad||0,o={v:0};
    ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>gsap.to(o,{v:to,duration:1.8,ease:'expo.out',onUpdate:()=>el.textContent=pad2(Math.round(o.v),p)})})});
  function pad2(n,p){return String(n).padStart(p,'0')}

  /* footer wordmark */
  $$('.giant span').forEach(sp=>{const w=split(sp);gsap.set(w,{yPercent:105});
    ScrollTrigger.create({trigger:'.giant',start:'top 94%',once:true,onEnter:()=>gsap.to(w,{yPercent:0,duration:1.5,ease:'expo.out',stagger:.07})})});
}

/* =====================================================
   LOADER → HERO ENTRANCE
   ===================================================== */
const loader=$('.loader');
function heroIn(){
  header&&header.classList.add('ready');
  if(reduce)return;
  const tl=gsap.timeline({defaults:{ease:'expo.out'}});
  if($('.hero-img'))tl.fromTo('.hero-img',{scale:1.25},{scale:1,duration:2.4},0);
  if(heroWords.length)tl.to(heroWords,{yPercent:0,duration:1.4,stagger:.08},0.05);
  if($('[data-h]'))tl.fromTo('[data-h]',{y:26,opacity:0},{y:0,opacity:1,duration:1.2,stagger:.1},0.3);
}
if(reduce||!loader){ loader&&loader.remove(); heroIn(); }
else{
  const lt=gsap.timeline({onComplete:()=>{loader.remove();ScrollTrigger.refresh()}});
  lt.to('.ld-logo',{opacity:1,y:0,duration:.7,ease:'expo.out'})
    .to('.ld-bar',{scaleX:1,duration:.9,ease:'power3.inOut'},0)
    .to('.loader',{yPercent:-100,duration:1,ease:'expo.inOut'},'+=.1')
    .add(heroIn,'-=.55');
  setTimeout(()=>{if(document.body.contains(loader)){loader.remove();heroIn()}},6000);
}

D99.inview();
/* keep every trigger in sync with the real layout: images, fonts and late content change page height */
(function(){
  let t=null,last=document.documentElement.scrollHeight;
  const sync=()=>{clearTimeout(t);t=setTimeout(()=>{const h=document.documentElement.scrollHeight;if(Math.abs(h-last)>2){last=h;ScrollTrigger.refresh()}},120)};
  $$('img').forEach(i=>{if(!i.complete)i.addEventListener('load',sync,{once:true})});
  if(window.ResizeObserver)new ResizeObserver(sync).observe(document.body);
})();
addEventListener('load',()=>ScrollTrigger.refresh());
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>ScrollTrigger.refresh());
})();
