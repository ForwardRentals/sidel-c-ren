// scroll progress + nav solid
const prog=document.getElementById('prog'),nav=document.getElementById('nav');
addEventListener('scroll',()=>{
  const h=document.documentElement;
  const p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);
  if(prog)prog.style.width=(p*100)+'%';
  if(nav)nav.classList.toggle('solid',h.scrollTop>40);
},{passive:true});

// mobile nav drawer
const ntog=document.getElementById('navtoggle'),nlinks=document.getElementById('navlinks');
if(ntog&&nlinks){
  ntog.addEventListener('click',()=>{
    const open=nlinks.classList.toggle('open');
    ntog.setAttribute('aria-expanded',open?'true':'false');
  });
  nlinks.addEventListener('click',e=>{
    if(e.target.tagName==='A'){nlinks.classList.remove('open');ntog.setAttribute('aria-expanded','false');}
  });
}

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

// lead form — posts to the Cloudflare Worker, which files a GitHub Issue
const LEAD_ENDPOINT = "https://sidel-cren-leads.thefulltimehobby.workers.dev";
const leadform = document.getElementById('leadform');
if (leadform) {
  leadform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('lf-submit');
    const msg = document.getElementById('lf-msg');
    const data = Object.fromEntries(new FormData(leadform).entries());
    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = 'Sending…';
    msg.className = 'formmsg';
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error || 'Something went wrong');
      leadform.reset();
      msg.textContent = "Thanks — we've got it. We'll follow up shortly.";
      msg.className = 'formmsg show ok';
    } catch (err) {
      msg.textContent = "Couldn't send that automatically — please email michaellogan@sidelcren.com or call (805) 462-1250 instead.";
      msg.className = 'formmsg show err';
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
}

// parallax on showcase images
const px=[...document.querySelectorAll('.showcase img')];
addEventListener('scroll',()=>{
  px.forEach(img=>{
    const r=img.parentElement.getBoundingClientRect();
    if(r.bottom<0||r.top>innerHeight)return;
    img.style.transform=`translateY(${(r.top/innerHeight)*-40}px)`;
  });
},{passive:true});
