(function(){
  'use strict';
  var WA_NUMBER='254795716730', EMAIL='michaelkey394@gmail.com';
  var $=function(s,c){return (c||document).querySelector(s);};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};

  $('#year').textContent=new Date().getFullYear();

  /* ---------- STYLE SWITCHER (default: A) ---------- */
  var root=document.documentElement;
  var styleBtns=$$('[data-set-style]');
  function setStyle(s){
    root.setAttribute('data-style',s);
    styleBtns.forEach(function(b){b.classList.toggle('active',b.getAttribute('data-set-style')===s);});
    try{localStorage.setItem('ems-style',s);}catch(e){}
  }
  styleBtns.forEach(function(b){b.addEventListener('click',function(){setStyle(b.getAttribute('data-set-style'));});});
  setStyle(root.getAttribute('data-style')||'a');

  /* ---------- THEME (default: light) ---------- */
  $('#themeToggle').addEventListener('click',function(){
    var n=root.getAttribute('data-theme')==='dark'?'light':'dark';
    root.setAttribute('data-theme',n);
    try{localStorage.setItem('ems-theme',n);}catch(e){}
  });

  /* ---------- TOAST ---------- */
  var toastEl=$('#toast'),tT;
  function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(tT);tT=setTimeout(function(){toastEl.classList.remove('show');},2600);}

  /* ---------- NAV ---------- */
  var navToggle=$('#navToggle'),navMenu=$('#navMenu');
  navToggle.addEventListener('click',function(){navMenu.classList.toggle('open');navToggle.classList.toggle('active');});
  $$('#navMenu a').forEach(function(a){a.addEventListener('click',function(){navMenu.classList.remove('open');navToggle.classList.remove('active');});});

  /* ---------- SCROLL ---------- */
  var header=$('#header'),progress=$('#progress'),backTop=$('#backTop'),tick=false;
  function onScroll(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    var y=window.scrollY||window.pageYOffset;
    progress.style.width=(h>0?(y/h)*100:0)+'%';
    header.classList.toggle('scrolled',y>10);
    backTop.classList.toggle('show',y>600);
    tick=false;
  }
  window.addEventListener('scroll',function(){if(!tick){requestAnimationFrame(onScroll);tick=true;}},{passive:true});
  onScroll();
  backTop.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});

  /* ---------- ACTIVE NAV ---------- */
  var navLinks=$$('#navMenu a[href^="#"]');
  var navIO=new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){
        var id=en.target.id;
        navLinks.forEach(function(l){l.classList.toggle('active',l.getAttribute('href')==='#'+id);});
      }
    });
  },{rootMargin:'-45% 0px -50% 0px'});
  $$('section[id]').forEach(function(s){navIO.observe(s);});

  /* ---------- REVEAL ---------- */
  var rIO=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');rIO.unobserve(en.target);}});
  },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  $$('.reveal').forEach(function(el){rIO.observe(el);});

  /* ---------- COUNTERS ---------- */
  function animate(el){
    var t=parseFloat(el.getAttribute('data-count'))||0;
    var s=el.getAttribute('data-suffix')||'';
    var dur=1600,st=null;
    function tk(ts){
      if(!st)st=ts;
      var p=Math.min((ts-st)/dur,1);
      var e=1-Math.pow(1-p,3);
      el.textContent=Math.round(t*e)+s;
      if(p<1)requestAnimationFrame(tk);
    }
    requestAnimationFrame(tk);
  }
  var cIO=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){animate(en.target);cIO.unobserve(en.target);}});
  },{threshold:.5});
  $$('[data-count]').forEach(function(el){cIO.observe(el);});

  /* ---------- PORTFOLIO FILTER ---------- */
  $$('.filter-btn').forEach(function(b){
    b.addEventListener('click',function(){
      $$('.filter-btn').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      var f=b.getAttribute('data-filter');
      $$('.p-item').forEach(function(i){i.style.display=(f==='all'||i.getAttribute('data-cat')===f)?'':'none';});
    });
  });

  /* ---------- LIGHTBOX ---------- */
  var lb=$('#lightbox'),lbM=$('#lbMedia'),lbT=$('#lbTitle'),lbD=$('#lbDesc'),lbC=$('#lbCat');
  function openLb(item){
    var ph=item.querySelector('.ph');
    lbM.textContent=ph?ph.textContent.trim():'[ PROJECT IMAGE ]';
    lbT.textContent=item.getAttribute('data-title')||'Project';
    lbD.textContent=item.getAttribute('data-desc')||'';
    lbC.textContent=item.querySelector('.p-cat')?item.querySelector('.p-cat').textContent:'';
    lb.classList.add('open');document.body.style.overflow='hidden';
  }
  function closeLb(){lb.classList.remove('open');document.body.style.overflow='';}
  $$('.p-item').forEach(function(i){i.addEventListener('click',function(){openLb(i);});});
  $('#lbClose').addEventListener('click',closeLb);
  lb.addEventListener('click',function(e){if(e.target===lb)closeLb();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLb();});

  /* ---------- TESTIMONIALS ---------- */
  var track=$('#tTrack'),slides=$$('.t-slide',track),dotsWrap=$('#tDots'),idx=0,auto;
  slides.forEach(function(_,i){
    var d=document.createElement('button');
    d.className='t-dot'+(i===0?' active':'');
    d.setAttribute('aria-label','Go to review '+(i+1));
    d.addEventListener('click',function(){go(i);});
    dotsWrap.appendChild(d);
  });
  var dots=$$('.t-dot',dotsWrap);
  function go(n){idx=(n+slides.length)%slides.length;track.style.transform='translateX('+(-idx*100)+'%)';dots.forEach(function(d,i){d.classList.toggle('active',i===idx);});}
  function startAuto(){auto=setInterval(function(){go(idx+1);},6500);}
  function stopAuto(){clearInterval(auto);}
  $('#tNext').addEventListener('click',function(){go(idx+1);stopAuto();startAuto();});
  $('#tPrev').addEventListener('click',function(){go(idx-1);stopAuto();startAuto();});
  var tv=$('.t-viewport');
  tv.addEventListener('mouseenter',stopAuto);tv.addEventListener('mouseleave',startAuto);
  startAuto();
  var tx0=null;
  tv.addEventListener('touchstart',function(e){tx0=e.touches[0].clientX;},{passive:true});
  tv.addEventListener('touchend',function(e){if(tx0===null)return;var dx=e.changedTouches[0].clientX-tx0;if(Math.abs(dx)>45)go(dx<0?idx+1:idx-1);tx0=null;},{passive:true});

  /* ---------- FAQ ---------- */
  $$('.faq-q').forEach(function(q){
    q.addEventListener('click',function(){
      var it=q.parentElement,isOpen=it.classList.contains('open');
      $$('.faq-item').forEach(function(i){i.classList.remove('open');});
      if(!isOpen)it.classList.add('open');
    });
  });

  /* ---------- COPY ---------- */
  $$('.copy-btn').forEach(function(b){
    b.addEventListener('click',function(){
      var t=b.getAttribute('data-copy');
      function done(){toast('Copied: '+t);}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done).catch(fb);}else fb();
      function fb(){var x=document.createElement('textarea');x.value=t;x.style.position='fixed';x.style.opacity='0';document.body.appendChild(x);x.select();try{document.execCommand('copy');done();}catch(e){}document.body.removeChild(x);}
    });
  });

  /* ---------- NEWSLETTER ---------- */
  $('#newsForm').addEventListener('submit',function(e){
    e.preventDefault();var i=this.querySelector('input');if(!i.value.trim())return;toast("Thanks! We'll be in touch.");i.value='';
  });

  /* ---------- QUOTE FORM ---------- */
  var form=$('#quoteForm'),fsteps=$$('.fstep',form);
  var stepLabel=$('#stepLabel'),stepFill=$('#stepFill');
  var prevBtn=$('#prevBtn'),nextBtn=$('#nextBtn'),mainNav=$('#mainNav');
  var current=0;

  function renderStep(){
    fsteps.forEach(function(s,i){s.classList.toggle('active',i===current);});
    stepLabel.textContent='Step '+(current+1)+' of '+fsteps.length;
    stepFill.style.width=((current+1)/fsteps.length)*100+'%';
    prevBtn.style.visibility=current===0?'hidden':'visible';
    mainNav.style.display=current===fsteps.length-1?'none':'flex';
    if(current===fsteps.length-1)buildSummary();
    var shell=$('.quote-shell');
    var top=shell.getBoundingClientRect().top+window.scrollY-100;
    if(window.scrollY>top+20||window.scrollY<top-200)window.scrollTo({top:top,behavior:'smooth'});
  }
  function markErr(f,e){if(!f)return;f.classList.toggle('error',e);}
  function validateStep(step){
    var ok=true;
    $$('[data-req]',step).forEach(function(el){
      var w=el.closest('.field'),v=(el.value||'').trim(),valid=v.length>0;
      if(valid&&el.getAttribute('data-type')==='email')valid=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if(!valid){ok=false;markErr(w,true);}else markErr(w,false);
    });
    var g=$('[data-req-group]',step);
    if(g){
      var any=$$('input[data-req-group]:checked',step).length>0;
      if(!any){ok=false;markErr($('#svcField'),true);}else markErr($('#svcField'),false);
    }
    if(!ok)toast('Please complete the highlighted fields.');
    return ok;
  }
  form.addEventListener('input',function(e){var w=e.target.closest('.field');if(w)w.classList.remove('error');});
  form.addEventListener('change',function(e){var w=e.target.closest('.field');if(w)w.classList.remove('error');});

  nextBtn.addEventListener('click',function(){if(!validateStep(fsteps[current]))return;if(current<fsteps.length-1){current++;renderStep();}});
  prevBtn.addEventListener('click',function(){if(current>0){current--;renderStep();}});
  $('#backTo3').addEventListener('click',function(){current=2;renderStep();});

  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function buildSummary(){
    var svc=$$('input[name="services"]:checked',form).map(function(i){return i.value;}).join(', ')||'—';
    var bEl=$('input[name="budget"]:checked',form);
    var pEl=$('input[name="contactPref"]:checked',form);
    var rows=[
      ['Services',svc],
      ['Budget',bEl?bEl.value:'Not specified'],
      ['Details',$('#details').value||'—'],
      ['Timeline',$('#timeline').value||'Not specified'],
      ['Existing site',$('#existing').value||'Not specified'],
      ['Reference',$('#reference').value||'—'],
      ['Name',$('#name').value||'—'],
      ['Business',$('#business').value||'—'],
      ['Email',$('#email').value||'—'],
      ['Phone',$('#phone').value||'—'],
      ['Contact via',pEl?pEl.value:'—']
    ];
    $('#summary').innerHTML=rows.map(function(r){return'<div class="summary-row"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>';}).join('');
  }

  function buildMessage(){
    var svc=$$('input[name="services"]:checked',form).map(function(i){return i.value;}).join(', ')||'Not specified';
    var bEl=$('input[name="budget"]:checked',form);
    var pEl=$('input[name="contactPref"]:checked',form);
    var lines=[
      '*NEW QUOTE REQUEST*',
      "*EM'S Tech Solutions Kenya",
      '',
      '*Services:* '+svc,
      '*Budget:* '+(bEl?bEl.value:'Not specified'),
      '*Timeline:* '+($('#timeline').value||'Not specified'),
      '*Existing site/app:* '+($('#existing').value||'Not specified'),
      '',
      '*Project details:*',
      ($('#details').value||'—'),
      '',
      $('#reference').value?'*References:* '+$('#reference').value:'',
      '',
      '*--- Contact ---*',
      '*Name:* '+($('#name').value||'—'),
      $('#business').value?'*Business:* '+$('#business').value:'',
      '*Email:* '+($('#email').value||'—'),
      '*Phone:* '+($('#phone').value||'—'),
      '*Preferred contact:* '+(pEl?pEl.value:'—'),
      '',
      "Sent from the EM'S Tech website."
    ].filter(function(l){return l!=='';});
    return lines.join('\n');
  }

  function validateAll(){
    for(var i=0;i<fsteps.length-1;i++){
      if(!validateStep(fsteps[i])){current=i;renderStep();return false;}
    }
    return true;
  }

    function goToThankYou(via, serverReference){
    var params = new URLSearchParams();
    var n = ($('#name').value||'').trim();
    var svcArr = $$('input[name="services"]:checked',form).map(function(i){return i.value;});
    var bEl = $('input[name="budget"]:checked',form);
    if(n) params.set('name', n);
    if(via) params.set('via', via);
    if(svcArr.length) params.set('services', svcArr.join(', '));
    if(bEl) params.set('budget', bEl.value);
    params.set('ref', serverReference || ('EMS-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*9000)+1000)));
    setTimeout(function(){
      window.location.href = 'thank-you.html?' + params.toString();
    }, 1200);
  }

    /* ---------- SAVE TO BACKEND ---------- */
  function saveBooking(submittedVia){
    var payload = {
      name: ($('#name').value || '').trim(),
      email: ($('#email').value || '').trim(),
      phone: ($('#phone').value || '').trim(),
      business: ($('#business').value || '').trim(),
      services: $$('input[name="services"]:checked', form).map(function(i){ return i.value; }),
      budget: (function(){ var el = $('input[name="budget"]:checked', form); return el ? el.value : ''; })(),
      timeline: $('#timeline').value || '',
      existing_site: $('#existing').value || '',
      reference_sites: $('#reference').value || '',
      details: ($('#details').value || '').trim(),
      contact_pref: (function(){ var el = $('input[name="contactPref"]:checked', form); return el ? el.value : 'WhatsApp'; })(),
      submitted_via: submittedVia
    };
    return fetch('/api/submit-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res){
      if (!res.ok) {
        return res.json().catch(function(){ return {}; }).then(function(err){
          throw new Error(err.error || 'Submission failed');
        });
      }
      return res.json();
    });
  }

  $('#sendWa').addEventListener('click', function(){
    if (!validateAll()) return;
    var btn = this;
    var original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Sending…';

    saveBooking('whatsapp').then(function(result){
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage()), '_blank');
      toast('Opening WhatsApp…');
      goToThankYou('whatsapp', result.reference);
    }).catch(function(err){
      console.error(err);
      toast('Saving issue — opening WhatsApp directly…');
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage()), '_blank');
      goToThankYou('whatsapp');
    }).finally(function(){
      btn.disabled = false;
      btn.innerHTML = original;
    });
  });

  $('#sendEmail').addEventListener('click', function(){
    if (!validateAll()) return;
    var btn = this;
    var original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Sending…';

    saveBooking('email').then(function(result){
      var subject = 'Quote Request — ' + ($('#name').value || 'Website Enquiry');
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildMessage());
      toast('Opening your email app…');
      goToThankYou('email', result.reference);
    }).catch(function(err){
      console.error(err);
      toast('Saving issue — opening email directly…');
      var subject = 'Quote Request — ' + ($('#name').value || 'Website Enquiry');
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildMessage());
      goToThankYou('email');
    }).finally(function(){
      btn.disabled = false;
      btn.innerHTML = original;
    });
  });

  renderStep();

/* ═══════════════════════════════════════════════════════════════
   HERO KEN BURNS SLIDER
   ═══════════════════════════════════════════════════════════════ */
(function(){
  var slides   = document.querySelectorAll('.hero-slide');
  var dotsWrap = document.getElementById('heroDots');
  var hero     = document.querySelector('.hero');

  if (!slides.length || !dotsWrap || !hero) return;

  var idx    = 0;
  var total  = slides.length;
  var timer  = null;
  var PAUSE  = 7000;

  slides.forEach(function(_, i){
    var d = document.createElement('button');
    d.className = 'hero-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    d.setAttribute('role', 'tab');
    d.addEventListener('click', function(){
      go(i);
      stop();
      start();
    });
    dotsWrap.appendChild(d);
  });

  var dots = dotsWrap.querySelectorAll('.hero-dot');

  function go(n){
    idx = (n + total) % total;
    slides.forEach(function(s){
      s.classList.remove('active');
      s.style.animation = 'none';
      void s.offsetWidth;
      s.style.animation = '';
    });
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        slides[idx].classList.add('active');
      });
    });
    dots.forEach(function(d, i){
      d.classList.toggle('active', i === idx);
    });
  }

  function start(){ timer = setInterval(function(){ go(idx + 1); }, PAUSE); }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);

  var tx0 = null;
  hero.addEventListener('touchstart', function(e){
    tx0 = e.touches[0].clientX;
  }, {passive:true});
  hero.addEventListener('touchend', function(e){
    if (tx0 === null) return;
    var dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 50) {
      go(dx < 0 ? idx + 1 : idx - 1);
      stop();
      start();
    }
    tx0 = null;
  }, {passive:true});

  start();
})();

})();
