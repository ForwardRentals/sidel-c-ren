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

// scroll-spy: highlight the nav item whose section is currently in view
const spyEls=[...document.querySelectorAll('[data-spy]')];
if(spyEls.length){
  const spyTargets=spyEls.map(a=>({a,el:document.getElementById(a.dataset.spy)})).filter(t=>t.el);
  if(spyTargets.length){
    const spyObs=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const t=spyTargets.find(t=>t.el===entry.target);
        if(!t)return;
        spyEls.forEach(a=>a.classList.remove('active'));
        t.a.classList.add('active');
      });
    },{rootMargin:'-92px 0px -65% 0px',threshold:0});
    spyTargets.forEach(t=>spyObs.observe(t.el));
  }
}

// search
const stog=document.getElementById('searchtoggle'),smodal=document.getElementById('searchmodal'),sinput=document.getElementById('searchinput'),sresults=document.getElementById('searchresults'),sclose=document.getElementById('searchclose');
let searchIdx=null,searchIdxPromise=null,searchSel=-1;
function loadSearchIndex(){
  if(!searchIdxPromise)searchIdxPromise=fetch('search-index.json').then(r=>r.json()).then(d=>searchIdx=d).catch(()=>searchIdx=[]);
  return searchIdxPromise;
}
function escHtml(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function renderResults(q){
  if(!searchIdx)return;
  q=q.trim().toLowerCase();
  searchSel=-1;
  let matches;
  if(!q){matches=searchIdx;}
  else{
    matches=searchIdx.filter(item=>
      item.title.toLowerCase().includes(q)||item.desc.toLowerCase().includes(q)||item.category.toLowerCase().includes(q)
    ).slice(0,12);
  }
  if(!matches.length){sresults.innerHTML='<div class="searchempty">No matches for “'+escHtml(q)+'”. Try a different term.</div>';return;}
  sresults.innerHTML=matches.map(m=>'<a href="'+m.url+'"><div class="sc">'+escHtml(m.category)+'</div><div class="st">'+escHtml(m.title)+'</div><div class="sd">'+escHtml(m.desc)+'</div></a>').join('');
}
function openSearch(){
  if(!smodal)return;
  if(nlinks&&nlinks.classList.contains('open')){nlinks.classList.remove('open');if(ntog)ntog.setAttribute('aria-expanded','false');}
  smodal.classList.add('open');
  loadSearchIndex().then(()=>{renderResults(sinput.value||'');});
  setTimeout(()=>sinput.focus(),10);
}
function closeSearch(){
  if(!smodal)return;
  smodal.classList.remove('open');
}
if(stog)stog.addEventListener('click',openSearch);
if(sclose)sclose.addEventListener('click',closeSearch);
if(smodal)smodal.addEventListener('click',e=>{if(e.target===smodal)closeSearch();});
if(sinput)sinput.addEventListener('input',()=>renderResults(sinput.value));
document.addEventListener('keydown',e=>{
  const tag=document.activeElement.tagName;
  if(e.key==='/'&&tag!=='INPUT'&&tag!=='TEXTAREA'&&smodal&&!smodal.classList.contains('open')){
    e.preventDefault();openSearch();
  }else if(e.key==='Escape'&&smodal&&smodal.classList.contains('open')){
    closeSearch();
  }
});

// chat widget
const CHAT_ENDPOINT = "https://sidel-cren-chat.thefulltimehobby.workers.dev";
// The inline lead form posts to CHAT_ENDPOINT + "/lead" (below), never
// straight to the CRM backend — that keeps its ingest key server-side only.
const cbtn=document.getElementById('chatbtn'),cpanel=document.getElementById('chatpanel'),cclose=document.getElementById('chatclose'),cmsgs=document.getElementById('chatmsgs'),cform=document.getElementById('chatform'),cinput=document.getElementById('chatinput');
let chatHistory=[];
let chatFormShown=false;
let chatLeadFiled=false;
function addChatMsg(role,text){
  const el=document.createElement('div');
  el.className='cmsg '+(role==='user'?'user':'bot');
  el.textContent=text;
  cmsgs.appendChild(el);
  cmsgs.scrollTop=cmsgs.scrollHeight;
  return el;
}
function addChatTyping(){
  const el=document.createElement('div');
  el.className='cmsg typing';
  el.innerHTML='<span></span><span></span><span></span>';
  cmsgs.appendChild(el);
  cmsgs.scrollTop=cmsgs.scrollHeight;
  return el;
}
function addChatLeadForm(){
  chatFormShown=true;
  const wrap=document.createElement('div');
  wrap.className='cmsg bot leadform';
  wrap.innerHTML=`
    <div class="leadform-intro">Happy to pass this straight to the team — leave your details and what you'd like to discuss:</div>
    <input type="text" class="lf-name" placeholder="Your name" autocomplete="name">
    <input type="email" class="lf-email" placeholder="Your email" autocomplete="email">
    <input type="tel" class="lf-phone" placeholder="Phone (optional)" autocomplete="tel">
    <textarea class="lf-topic" placeholder="What would you like to talk about?"></textarea>
    <div class="leadform-actions">
      <button type="button" class="leadform-skip">Maybe later</button>
      <button type="button" class="leadform-submit">Send to the team</button>
    </div>
    <div class="leadform-msg"></div>
  `;
  cmsgs.appendChild(wrap);
  cmsgs.scrollTop=cmsgs.scrollHeight;

  const msgEl=wrap.querySelector('.leadform-msg');
  wrap.querySelector('.leadform-skip').addEventListener('click',()=>{
    wrap.remove();
  });
  wrap.querySelector('.leadform-submit').addEventListener('click', async ()=>{
    const name=wrap.querySelector('.lf-name').value.trim();
    const email=wrap.querySelector('.lf-email').value.trim();
    const phone=wrap.querySelector('.lf-phone').value.trim();
    const topic=wrap.querySelector('.lf-topic').value.trim();
    if(!name||!email||!email.includes('@')){
      msgEl.textContent='Please add your name and a valid email.';
      msgEl.className='leadform-msg show err';
      return;
    }
    const btn=wrap.querySelector('.leadform-submit');
    btn.disabled=true;
    btn.textContent='Sending…';
    try{
      const res=await fetch(CHAT_ENDPOINT+'/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        name, email, phone, message:topic, transcript:chatHistory
      })});
      const out=await res.json();
      if(!res.ok||!out.ok)throw new Error((out&&out.error)||'Something went wrong');
      chatLeadFiled=true;
      wrap.innerHTML='<div class="leadform-intro">Thanks — Michael will follow up shortly.</div>';
    }catch(err){
      msgEl.textContent="Couldn't send that — try again, or email michaellogan@sidelcren.com directly.";
      msgEl.className='leadform-msg show err';
      btn.disabled=false;
      btn.textContent='Send to the team';
    }
  });
}
if(cbtn&&cpanel){
  cbtn.addEventListener('click',()=>{
    cpanel.classList.toggle('open');
    if(cpanel.classList.contains('open'))setTimeout(()=>cinput&&cinput.focus(),10);
  });
}
if(cclose)cclose.addEventListener('click',()=>cpanel.classList.remove('open'));
if(cform){
  cform.addEventListener('submit', async e=>{
    e.preventDefault();
    const text=cinput.value.trim();
    if(!text)return;
    addChatMsg('user',text);
    chatHistory.push({role:'user',content:text});
    cinput.value='';
    cinput.disabled=true;
    const typingEl=addChatTyping();
    try{
      const res=await fetch(CHAT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chatHistory, formShown:chatFormShown, leadFiled:chatLeadFiled})});
      const out=await res.json();
      typingEl.remove();
      if(!res.ok||!out.reply)throw new Error((out&&out.error)||'Something went wrong');
      addChatMsg('bot',out.reply);
      chatHistory.push({role:'assistant',content:out.reply});
      if(out.leadCaptured)chatLeadFiled=true;
      if(out.showContactForm&&!chatFormShown)addChatLeadForm();
    }catch(err){
      typingEl.remove();
      addChatMsg('bot',"Sorry, I'm having trouble right now — try again, or reach us directly at michaellogan@sidelcren.com.");
    }finally{
      cinput.disabled=false;
      cinput.focus();
    }
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

// lead form — files into the Sidel CREN CRM (via the chat Worker's /lead
// relay, so the ingest key stays server-side, never in this browser JS) and
// emails Michael Logan directly through Web3Forms, in parallel. Either path
// succeeding is enough to tell the visitor it went through.
const WEB3FORMS_ACCESS_KEY = "98a0a540-06c8-40fb-a156-5d4c6821a5a4";
const leadform = document.getElementById('leadform');
if (leadform) {
  leadform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('lf-submit');
    const msg = document.getElementById('lf-msg');
    const data = Object.fromEntries(new FormData(leadform).entries());
    if (data.website) return; // honeypot tripped — silently drop, no response needed
    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = 'Sending…';
    msg.className = 'formmsg';

    const crmSend = fetch(CHAT_ENDPOINT + '/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'website-contact-form',
        name: data.name, email: data.email, phone: data.phone,
        company: data.company, industry: data.industry, message: data.message,
      }),
    }).then(async (res) => {
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error('crm ingest failed');
    });

    const emailSend = fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        ...data,
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `Sidel CREN — Consultation Request from ${data.name || 'website visitor'}`,
      }),
    }).then(async (res) => {
      const out = await res.json();
      if (!res.ok || !out.success) throw new Error('web3forms failed');
    });

    const [crmResult, emailResult] = await Promise.allSettled([crmSend, emailSend]);

    if (crmResult.status === 'fulfilled' || emailResult.status === 'fulfilled') {
      leadform.reset();
      msg.textContent = "Thanks — we've got it. We'll follow up shortly.";
      msg.className = 'formmsg show ok';
    } else {
      msg.textContent = "Couldn't send that automatically — please email michaellogan@sidelcren.com or call (805) 462-1250 instead.";
      msg.className = 'formmsg show err';
    }
    btn.disabled = false;
    btn.textContent = originalLabel;
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
