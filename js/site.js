// scroll progress + nav solid
const prog=document.getElementById('prog'),nav=document.getElementById('nav');
addEventListener('scroll',()=>{
  const h=document.documentElement;
  const p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);
  if(prog)prog.style.width=(p*100)+'%';
  if(nav)nav.classList.toggle('solid',h.scrollTop>40);
},{passive:true});

// reveal on scroll
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.16});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// count-up stats: data-count, optional data-prefix / data-suffix / data-decimals
const cio=new IntersectionObserver(es=>{es.forEach(e=>{
  if(!e.isIntersecting)return;
  const el=e.target,end=parseFloat(el.dataset.count),pre=el.dataset.prefix||'',suf=el.dataset.suffix||'',dec=+(el.dataset.decimals||0);
  let s=null;const dur=1400;
  const step=t=>{s=s||t;const k=Math.min((t-s)/dur,1);const v=((1-Math.pow(1-k,3))*end).toFixed(dec);el.textContent=pre+v+suf;if(k<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);cio.unobserve(el);
})},{threshold:.6});
document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));

// parallax on showcase images
const px=[...document.querySelectorAll('.showcase img')];
addEventListener('scroll',()=>{
  px.forEach(img=>{
    const r=img.parentElement.getBoundingClientRect();
    if(r.bottom<0||r.top>innerHeight)return;
    img.style.transform=`translateY(${(r.top/innerHeight)*-40}px)`;
  });
},{passive:true});
