/* ══════════════════════════════════════════════════════════════════
   Em's Tech Solutions Kenya — Assistant "Emi"
   ──────────────────────────────────────────────────────────────────
   Fully scripted. No API. No cost. No tracking.
   Personality: welcoming, charming, honest.
   Knows: 14 core services + modern extras, pricing, hours, process, contact.

   Public API:
     EmiBot.open()      → open chat
     EmiBot.close()     → close chat
     EmiBot.reset()     → wipe history
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORAGE_KEY   = 'emi-chat-history';
  var SESSION_KEY   = 'emi-session-open';
  var WA_NUMBER     = '254795716730';
  var BOT_NAME      = 'Emi';

  /* ═════════════════════════════════════════════════════════════════
     KNOWLEDGE BASE
     ═════════════════════════════════════════════════════════════════ */
  var SERVICES = [
    { name: 'Website Design & Development', price: 'From KES 30,000', blurb: 'Modern, mobile-first websites that bring your business online and expand your client base.' },
    { name: 'Mobile App Development', price: 'Custom quote', blurb: 'Android and cross-platform apps built around how your customers and staff actually work.' },
    { name: 'Application Development', price: 'From KES 70,000', blurb: 'Custom applications with modern interfaces designed for efficient service or product delivery.' },
    { name: 'Software Development', price: 'Custom quote', blurb: 'Bespoke software built to solve your exact business problem — from POS to full management systems.' },
    { name: 'Graphics Designs', price: 'From KES 1,500', blurb: 'Logos, banners, posters, wedding cards, invitations, menus and decor designs — all in HD.' },
    { name: 'IT Consulting', price: 'From KES 500', blurb: 'Expert guidance on your IT setup, tools and infrastructure — affordable and honest.' },
    { name: 'Software Consulting', price: 'From KES 3,000', blurb: 'Stuck with a slow site, outdated app, or need a chatbot? We diagnose and advise ASAP.' },
    { name: 'Thesis & Project Delivery', price: 'From KES 5,000', blurb: 'Bachelor\'s and doctorate theses, plus project planning and ideas for undergraduates and postgraduates.' },
    { name: 'Resume CV Refinement', price: 'From KES 1,000', blurb: 'Kenyan or international modern resumes that shout "hire me" — just describe your role and qualifications.' },
    { name: 'Digital Marketing', price: 'Custom quote', blurb: 'Social media management, paid ads and content strategy that reaches real people.' },
    { name: 'IT Support Services', price: 'Custom quote', blurb: 'On-site and remote troubleshooting, maintenance, networking and hardware setup.' },
    { name: 'Cyber Services', price: 'Custom quote', blurb: 'eCitizen, KRA, NTSA, HELB — everyday digital government services handled fast and correctly.' },
    { name: 'Smart SEO', price: 'Custom quote', blurb: 'Get found on Google. We optimise your site, content and Google Business Profile.' },
    { name: 'Work Automation Systems', price: 'Custom quote', blurb: 'Replace manual paperwork with systems that track stock, sales, staff, clients and payments.' }
  ];

  var MODERN = [
    'AI Chatbot Integration',
    'Cloud Hosting & Deployment',
    'API Integration',
    'Data Analytics & Reports',
    'Business Process Automation',
    'E-commerce Solutions',
    'System Integration',
    'Cybersecurity Audits'
  ];

  /* ═════════════════════════════════════════════════════════════════
     RESPONSE BRAIN
     ═════════════════════════════════════════════════════════════════ */
  function findService(query) {
    var q = query.toLowerCase();
    var best = null, bestScore = 0;
    SERVICES.forEach(function (s) {
      var name = s.name.toLowerCase();
      var score = 0;
      var words = q.split(/\s+/);
      words.forEach(function (w) {
        if (w.length < 3) return;
        if (name.indexOf(w) > -1) score += 2;
      });
      /* Keyword hits */
      if (/web|site|website/.test(q) && /website/.test(name)) score += 5;
      if (/app|mobile|android/.test(q) && /mobile app/.test(name)) score += 5;
      if (/logo|poster|banner|graphic|design/.test(q) && /graphics/.test(name)) score += 5;
      if (/cv|resume/.test(q) && /resume/.test(name)) score += 6;
      if (/thesis|research|project idea/.test(q) && /thesis/.test(name)) score += 6;
      if (/seo|google|rank/.test(q) && /seo/.test(name)) score += 5;
      if (/automation|system|pos|inventory/.test(q) && /automation/.test(name)) score += 5;
      if (/consult|advice|advise|help.*it/.test(q) && /consulting/.test(name)) score += 4;
      if (/marketing|social|ads/.test(q) && /marketing/.test(name)) score += 5;
      if (/cyber|ecitizen|kra|ntsa|helb/.test(q) && /cyber/.test(name)) score += 6;
      if (/support|fix|repair/.test(q) && /IT Support/.test(name)) score += 4;

      if (score > bestScore) { bestScore = score; best = s; }
    });
    return bestScore >= 2 ? best : null;
  }

  var GREETING_POOL = [
    'Hi there! I\'m Emi. How can I help you today?',
    'Hey! Emi here. What can I do for you?',
    'Hello! Welcome to Em\'s Tech. I\'m Emi — what are you looking for today?'
  ];

  function greeting() {
    return GREETING_POOL[Math.floor(Math.random() * GREETING_POOL.length)];
  }

  function respond(input) {
    var q = input.toLowerCase().trim();

    /* --- Greetings --- */
    if (/^(hi|hello|hey|habari|sasa|niaje|mambo|jambo|good (morning|afternoon|evening))\b/.test(q)) {
      return {
        text: 'Hello! ' + greeting().replace(/^Hi there! I\'m Emi\.\s*/, '') + ' You can ask me about our services, prices, or how to get a quote.',
        chips: ['Show me services', 'Pricing', 'Get a quote', 'Where are you?']
      };
    }

    /* --- Thanks --- */
    if (/\b(thanks|thank you|asante|thx|appreciate)\b/.test(q)) {
      return {
        text: 'You\'re most welcome! 😊 Anything else I can help with?',
        chips: ['Services', 'Pricing', 'Talk to a human']
      };
    }

    /* --- Bye --- */
    if (/\b(bye|goodbye|kwaheri|later)\b/.test(q)) {
      return {
        text: 'Goodbye! If you need anything, I\'m right here. Karibu tena! 👋',
        chips: []
      };
    }

    /* --- Who are you / about --- */
    if (/(who are you|what are you|about (you|the bot|emi)|your name)/.test(q)) {
      return {
        text: 'I\'m Emi, Em\'s Tech Solutions Kenya\'s virtual assistant. I\'m here to help you find the right service, understand pricing, or connect you with our team. I know all 14 of our services plus a few modern extras. What can I help with?',
        chips: ['Services', 'Pricing', 'About the company']
      };
    }

    /* --- About the company --- */
    if (/(about (the )?(company|you|firm)|who is em|tell me about em)/.test(q)) {
      return {
        text: 'Em\'s Tech Solutions Kenya is a software company based in Kimbo, Ruiru. We were founded in 2025 and we help businesses, startups and students bring their ideas to life through technology. We have a 5.0 rating on Google with 18 reviews from happy clients.',
        chips: ['Services', 'Reviews', 'Get a quote']
      };
    }

    /* --- Hours --- */
    if (/(hours|open|opening|close|closing|time|when.*(open|avail))/.test(q)) {
      return {
        text: 'We\'re open Monday to Saturday, 8:00 am to 8:00 pm. Closed on Sundays. For anything urgent, WhatsApp us any time — we usually reply fast during working hours.',
        chips: ['Contact us', 'Get a quote']
      };
    }

    /* --- Location --- */
    if (/(where|location|address|find you|directions|kimbo|ruiru)/.test(q)) {
      return {
        text: 'We\'re based in Kimbo, Ruiru — plus code VX9G+CJ. We work with clients all over Kenya, mostly remotely via WhatsApp, calls and email. Want directions?',
        chips: ['Open in Maps', 'Contact us']
      };
    }

    /* --- Contact --- */
    if (/(contact|call|phone|reach|whatsapp|email)/.test(q)) {
      return {
        text: 'Easiest way to reach us:\n📞 Call or WhatsApp: 0795 716 730\n📧 Email: michaelkey394@gmail.com\nWe reply within a few hours during working hours (Mon–Sat, 8am–8pm).',
        chips: ['WhatsApp now', 'Get a quote']
      };
    }

    /* --- Pricing (general) --- */
    if (/(price|pricing|cost|how much|charge|rate|fee|quote)/.test(q)) {
      var service = findService(q);
      if (service) {
        var text = service.name + ' — ' + service.price + '. ' + service.blurb;
        if (service.price === 'Custom quote') {
          text += '\n\nEvery project is different, so we quote per scope. Tell me more about what you need and I\'ll suggest the next step.';
        }
        return {
          text: text,
          chips: ['Get a quote', 'Other services', 'Talk to a human']
        };
      }
      return {
        text: 'Happy to help with pricing! Here\'s a quick glance:\n\n• Website Design — from KES 30,000\n• Application Development — from KES 70,000\n• Graphics Designs — from KES 1,500\n• IT Consulting — from KES 500\n• Software Consulting — from KES 3,000\n• Thesis & Project — from KES 5,000\n• Resume CV — from KES 1,000\n\nMobile apps, digital marketing, IT support, SEO and automation are custom-quoted. Which one interests you?',
        chips: ['Get a quote', 'Website pricing', 'App pricing']
      };
    }

    /* --- Reviews --- */
    if (/(review|rating|testimonial|feedback|what.*say)/.test(q)) {
      return {
        text: 'We\'re proud of our 5.0-star rating on Google with 18 reviews! Here are a few:\n\n"Quite experienced and is flexible. Great job and of good quality." — Lewis Kuria\n\n"Best IT consultant." — Kaboro Grace\n\n"Great customer service." — Silvia\n\n"Amazing." — Ivan Jr',
        chips: ['Get a quote', 'Services']
      };
    }

    /* --- Process --- */
    if (/(process|how (do|does).*(work|start)|steps|procedure)/.test(q)) {
      return {
        text: 'Simple process:\n\n1. You tell us your idea (via this chat, WhatsApp, or the quote form)\n2. We send a clear written quote — scope, timeline, cost\n3. We build it with updates at every milestone\n4. Launch and ongoing support\n\nShall we start with a quote?',
        chips: ['Get a quote', 'Talk to a human']
      };
    }

    /* --- Services (general) --- */
    if (/(service|what.*offer|what.*do|capabilities|help with)/.test(q)) {
      return {
        text: 'We offer 14 services:\n\n1. Website Design & Development\n2. Mobile App Development\n3. Application Development\n4. Software Development\n5. Graphics Designs\n6. IT Consulting\n7. Software Consulting\n8. Thesis & Project Delivery\n9. Resume CV Refinement\n10. Digital Marketing\n11. IT Support Services\n12. Cyber Services\n13. Smart SEO\n14. Work Automation Systems\n\nWe also handle AI chatbot integration, cloud hosting, API integration, data analytics, e-commerce and more. Which one shall I tell you about?',
        chips: ['Website Design', 'Graphics Designs', 'Resume CV', 'Thesis help', 'Pricing']
      };
    }

    /* --- Specific service match --- */
    var svc = findService(q);
    if (svc) {
      var msg = svc.name + ' — ' + svc.price + '\n\n' + svc.blurb;
      return {
        text: msg,
        chips: ['Get a quote', 'Other services', 'Talk to a human']
      };
    }

    /* --- Modern extras --- */
    if (/(ai|chatbot|artificial|machine learning)/.test(q)) {
      return {
        text: 'Yes! We build and integrate AI chatbots into websites and apps. Great for customer service, lead capture and 24/7 response. You\'re literally talking to one right now. 😊 Want a quote?',
        chips: ['Get a quote', 'Services', 'Pricing']
      };
    }
    if (/(cloud|hosting|domain|deploy)/.test(q)) {
      return {
        text: 'We handle cloud hosting, domain registration, email setup and deployments. Whether you already have hosting or need it set up from scratch — we\'ve got you.',
        chips: ['Get a quote', 'Website pricing']
      };
    }
    if (/(api|integration|connect)/.test(q)) {
      return {
        text: 'We integrate APIs — M-Pesa payments, SMS gateways, Google services, WhatsApp Business, and custom internal APIs. Tell me what you\'d like to connect.',
        chips: ['Get a quote', 'Talk to a human']
      };
    }
    if (/(data|analytics|dashboard|report)/.test(q)) {
      return {
        text: 'We build dashboards and analytics systems that show you what\'s happening in your business — sales, stock, staff, clients. Real numbers, clear visuals.',
        chips: ['Get a quote', 'Automation systems']
      };
    }
    if (/(e-?commerce|online shop|sell online|payment)/.test(q)) {
      return {
        text: 'We build e-commerce stores with M-Pesa and card payment integration, product catalogues, and order management. From simple to full-scale.',
        chips: ['Get a quote', 'Website pricing']
      };
    }
    if (/(secure|security|cyber|hack|breach)/.test(q)) {
      return {
        text: 'We offer cybersecurity audits, secure hosting setup and cyber services (eCitizen, KRA, NTSA, HELB). If you\'re worried about security, let\'s talk.',
        chips: ['Get a quote', 'Contact us']
      };
    }

    /* --- Quote / start a project --- */
    if (/(quote|start|begin|hire|project|build.*me|work with you)/.test(q)) {
      return {
        text: 'Brilliant! The fastest path is our quote form — takes about 60 seconds and sends straight to our WhatsApp or email. Or I can connect you to a human right now.',
        chips: ['Open quote form', 'WhatsApp us']
      };
    }

    /* --- Human handoff --- */
    if (/(human|person|agent|team|talk to (someone|a human)|real person|manager)/.test(q)) {
      return {
        text: 'Of course! The quickest way to reach a human is WhatsApp — they usually reply within a few hours during working hours.\n\n📞 0795 716 730\n📧 michaelkey394@gmail.com',
        chips: ['WhatsApp now', 'Call now']
      };
    }

    /* --- Fallback (honest) --- */
    return {
      text: 'Let me be honest — I\'m not sure about that one. I know our services, pricing, hours, location, process and reviews really well. For anything else, our team can help directly.Click talk to human to talk to our team.',
      chips: ['Services', 'Pricing', 'WhatsApp a human']
    };
  }

  /* ═════════════════════════════════════════════════════════════════
     STATE
     ═════════════════════════════════════════════════════════════════ */
  var messages = [];
  var isOpen = false;

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) messages = JSON.parse(raw);
    } catch (e) { messages = []; }
  }
  function saveHistory() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); }
    catch (e) {}
  }

  /* ═════════════════════════════════════════════════════════════════
     ICONS & HTML
     ═════════════════════════════════════════════════════════════════ */
  var CHARACTER_SVG = ''
    + '<svg class="emi-face" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    +   '<defs>'
    +     '<linearGradient id="emiGrad" x1="0" y1="0" x2="1" y2="1">'
    +       '<stop offset="0%" stop-color="#60a5fa"/>'
    +       '<stop offset="100%" stop-color="#22d3ee"/>'
    +     '</linearGradient>'
    +     '<radialGradient id="emiGlow" cx="50%" cy="50%" r="50%">'
    +       '<stop offset="0%" stop-color="#22d3ee" stop-opacity=".55"/>'
    +       '<stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>'
    +     '</radialGradient>'
    +   '</defs>'
    /* Glow halo */
    +   '<circle cx="32" cy="32" r="30" fill="url(#emiGlow)"/>'
    /* Antenna */
    +   '<line x1="32" y1="10" x2="32" y2="18" stroke="url(#emiGrad)" stroke-width="2.4" stroke-linecap="round"/>'
    +   '<circle cx="32" cy="8" r="3" fill="url(#emiGrad)">'
    +     '<animate attributeName="r" values="3;3.6;3" dur="2s" repeatCount="indefinite"/>'
    +   '</circle>'
    /* Head — rounded square, tech feel */
    +   '<rect x="14" y="18" width="36" height="34" rx="13" fill="url(#emiGrad)"/>'
    /* Face plate */
    +   '<rect x="19" y="24" width="26" height="22" rx="9" fill="#0b1220" opacity=".92"/>'
    /* Eyes */
    +   '<circle cx="26.5" cy="34" r="2.6" fill="#22d3ee">'
    +     '<animate attributeName="opacity" values="1;1;0.1;1;1" dur="4s" repeatCount="indefinite"/>'
    +   '</circle>'
    +   '<circle cx="37.5" cy="34" r="2.6" fill="#22d3ee">'
    +     '<animate attributeName="opacity" values="1;1;0.1;1;1" dur="4s" repeatCount="indefinite"/>'
    +   '</circle>'
    /* Smile */
    +   '<path d="M27 40 Q32 43.5 37 40" stroke="#22d3ee" stroke-width="1.8" stroke-linecap="round" fill="none"/>'
    /* Cheek dots */
    +   '<circle cx="22.5" cy="38" r="1.2" fill="#60a5fa" opacity=".7"/>'
    +   '<circle cx="41.5" cy="38" r="1.2" fill="#60a5fa" opacity=".7"/>'
    + '</svg>';

  var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  var SEND_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>';

  /* ═════════════════════════════════════════════════════════════════
     CSS
     ═════════════════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('emi-styles')) return;
    var css = ''
    /* Floating button (character) */
    + '.emi-fab{position:fixed;right:24px;bottom:96px;z-index:890;'
    + 'width:66px;height:66px;border-radius:50%;border:2px solid rgba(34,211,238,.4);'
    + 'background:linear-gradient(135deg,#0b1220 0%,#131c30 100%);'
    + 'display:grid;place-items:center;cursor:pointer;'
    + 'box-shadow:0 14px 34px rgba(0,0,0,.35),0 0 26px rgba(34,211,238,.18);'
    + 'transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s;'
    + 'padding:0;font-family:var(--font-body,system-ui,sans-serif);}'
    + '.emi-fab:hover{transform:scale(1.08);box-shadow:0 18px 40px rgba(0,0,0,.4),0 0 40px rgba(34,211,238,.35);}'
    + '.emi-fab svg{width:42px;height:42px;}'
    + '.emi-fab::before{content:"";position:absolute;inset:-4px;border-radius:50%;'
    + 'border:2px solid rgba(34,211,238,.35);animation:emiPulse 2.6s ease-out infinite;}'
    + '@keyframes emiPulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.45);opacity:0}}'
    /* Unread badge */
    + '.emi-badge{position:absolute;top:-2px;right:-2px;min-width:22px;height:22px;'
    + 'border-radius:999px;background:#ef4444;color:#fff;font-size:.7rem;font-weight:800;'
    + 'display:grid;place-items:center;padding:0 6px;border:2px solid var(--bg,#fff);'
    + 'font-family:inherit;transition:transform .3s,opacity .3s;}'
    + '.emi-badge.hide{transform:scale(0);opacity:0;}'
    /* Tooltip */
    + '.emi-tip{position:absolute;right:74px;top:50%;transform:translateY(-50%) translateX(8px);'
    + 'background:var(--surface,#fff);color:var(--text,#0f172a);font-size:.78rem;font-weight:700;'
    + 'padding:.5rem .9rem;border-radius:10px;white-space:nowrap;opacity:0;pointer-events:none;'
    + 'transition:opacity .25s,transform .25s;box-shadow:0 8px 22px rgba(0,0,0,.15);'
    + 'border:1px solid var(--border,#e2e8f0);}'
    + '.emi-fab:hover .emi-tip{opacity:1;transform:translateY(-50%) translateX(0);}'
    /* Chat panel — floats from right */
    + '.emi-panel{position:fixed;right:24px;bottom:172px;z-index:895;'
    + 'width:376px;max-width:calc(100vw - 32px);'
    + 'height:min(600px,calc(100vh - 200px));'
    + 'background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);'
    + 'border-radius:18px;overflow:hidden;display:flex;flex-direction:column;'
    + 'box-shadow:0 30px 70px rgba(0,0,0,.28),0 8px 24px rgba(0,0,0,.12);'
    + 'font-family:var(--font-body,system-ui,sans-serif);'
    + 'opacity:0;visibility:hidden;pointer-events:none;'
    + 'transform:translateY(14px) scale(.96);transform-origin:bottom right;'
    + 'transition:opacity .3s,visibility .3s,transform .35s cubic-bezier(.34,1.56,.64,1);}'
    + '.emi-panel.open{opacity:1;visibility:visible;pointer-events:auto;'
    + 'transform:translateY(0) scale(1);}'
    /* Header */
    + '.emi-head{display:flex;align-items:center;gap:.75rem;padding:.95rem 1.1rem;'
    + 'background:linear-gradient(135deg,#0b1220 0%,#1e293b 100%);color:#fff;'
    + 'border-bottom:1px solid rgba(34,211,238,.15);position:relative;}'
    + '.emi-head .emi-face{width:38px;height:38px;flex-shrink:0;}'
    + '.emi-head-txt{flex:1;min-width:0;}'
    + '.emi-head-txt b{display:block;font-size:.94rem;font-weight:700;letter-spacing:-.01em;}'
    + '.emi-head-txt small{display:flex;align-items:center;gap:.4rem;'
    + 'font-size:.72rem;color:rgba(255,255,255,.7);margin-top:1px;}'
    + '.emi-head-txt small::before{content:"";width:7px;height:7px;border-radius:50%;'
    + 'background:#22c55e;box-shadow:0 0 8px #22c55e;}'
    + '.emi-close{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.08);'
    + 'color:#fff;display:grid;place-items:center;cursor:pointer;border:none;'
    + 'transition:.22s;flex-shrink:0;}'
    + '.emi-close:hover{background:rgba(239,68,68,.85);transform:rotate(90deg);}'
    + '.emi-close svg{width:16px;height:16px;}'
    /* Body — messages */
    + '.emi-body{flex:1;overflow-y:auto;padding:1.1rem 1rem;'
    + 'background:var(--surface-2,#f8fafc);display:flex;flex-direction:column;gap:.7rem;'
    + 'scroll-behavior:smooth;}'
    + '.emi-body::-webkit-scrollbar{width:6px;}'
    + '.emi-body::-webkit-scrollbar-thumb{background:var(--border,#e2e8f0);border-radius:99px;}'
    + '.emi-msg{max-width:84%;padding:.7rem .95rem;border-radius:14px;'
    + 'font-size:.86rem;line-height:1.55;word-wrap:break-word;white-space:pre-wrap;'
    + 'animation:emiMsgIn .35s cubic-bezier(.34,1.56,.64,1);}'
    + '@keyframes emiMsgIn{from{opacity:0;transform:translateY(8px) scale(.97)}'
    + 'to{opacity:1;transform:none}}'
    + '.emi-msg.bot{align-self:flex-start;background:var(--surface,#fff);'
    + 'color:var(--text,#0f172a);border:1px solid var(--border,#e2e8f0);'
    + 'border-bottom-left-radius:4px;}'
    + '.emi-msg.user{align-self:flex-end;'
    + 'background:linear-gradient(135deg,#1e40af 0%,#0ea5e9 100%);color:#fff;'
    + 'border-bottom-right-radius:4px;box-shadow:0 4px 12px rgba(30,64,175,.25);}'
    /* Quick reply chips */
    + '.emi-chips{display:flex;flex-wrap:wrap;gap:.4rem;padding:0 1rem .8rem;'
    + 'background:var(--surface-2,#f8fafc);}'
    + '.emi-chip{padding:.45rem .85rem;border-radius:999px;'
    + 'background:var(--surface,#fff);border:1.5px solid var(--border,#e2e8f0);'
    + 'color:var(--text,#0f172a);font-size:.78rem;font-weight:600;cursor:pointer;'
    + 'transition:.22s;font-family:inherit;}'
    + '.emi-chip:hover{border-color:#0ea5e9;color:#0ea5e9;transform:translateY(-1px);}'
    /* Typing indicator */
    + '.emi-typing{align-self:flex-start;background:var(--surface,#fff);'
    + 'border:1px solid var(--border,#e2e8f0);padding:.75rem 1rem;border-radius:14px;'
    + 'border-bottom-left-radius:4px;display:flex;gap:.3rem;align-items:center;}'
    + '.emi-typing span{width:7px;height:7px;border-radius:50%;background:#0ea5e9;'
    + 'animation:emiBounce 1.2s infinite;}'
    + '.emi-typing span:nth-child(2){animation-delay:.15s;}'
    + '.emi-typing span:nth-child(3){animation-delay:.3s;}'
    + '@keyframes emiBounce{0%,60%,100%{transform:translateY(0);opacity:.5}'
    + '30%{transform:translateY(-5px);opacity:1}}'
    /* Footer — input */
    + '.emi-foot{padding:.7rem .8rem;border-top:1px solid var(--border,#e2e8f0);'
    + 'background:var(--surface,#fff);display:flex;gap:.5rem;align-items:center;}'
    + '.emi-input{flex:1;padding:.7rem .95rem;border-radius:12px;'
    + 'border:1.5px solid var(--border,#e2e8f0);background:var(--surface-2,#f8fafc);'
    + 'font-size:.86rem;color:var(--text,#0f172a);font-family:inherit;transition:.22s;}'
    + '.emi-input:focus{outline:none;border-color:#0ea5e9;'
    + 'box-shadow:0 0 0 3px rgba(14,165,233,.15);background:var(--surface,#fff);}'
    + '.emi-send{width:42px;height:42px;border-radius:12px;border:none;flex-shrink:0;'
    + 'background:linear-gradient(135deg,#1e40af 0%,#0ea5e9 100%);color:#fff;'
    + 'display:grid;place-items:center;cursor:pointer;transition:.22s;}'
    + '.emi-send:hover{transform:translateY(-2px);'
    + 'box-shadow:0 8px 20px rgba(30,64,175,.35);}'
    + '.emi-send svg{width:18px;height:18px;}'
    + '.emi-send:disabled{opacity:.5;cursor:not-allowed;transform:none;}'
    /* Footer note */
    + '.emi-note{font-size:.66rem;text-align:center;padding:.4rem 1rem .55rem;'
    + 'background:var(--surface,#fff);color:var(--muted,#5b6b82);'
    + 'border-top:1px solid var(--border,#e2e8f0);}'
    + '.emi-note a{color:#0ea5e9;font-weight:600;}'
    /* Mobile */
    + '@media(max-width:600px){'
    + '.emi-fab{right:18px;bottom:84px;width:58px;height:58px;}'
    + '.emi-fab svg{width:36px;height:36px;}'
    + '.emi-fab .emi-tip{display:none;}'
    + '.emi-panel{right:12px;left:12px;width:auto;bottom:152px;'
    + 'height:min(72vh,calc(100vh - 180px));}'
    + '}'
    + '@media(prefers-reduced-motion:reduce){'
    + '.emi-fab::before,.emi-msg{animation:none !important;}'
    + '}';
    var s = document.createElement('style');
    s.id = 'emi-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ═════════════════════════════════════════════════════════════════
     BUILD DOM
     ═════════════════════════════════════════════════════════════════ */
  var fabEl, panelEl, bodyEl, chipsEl, inputEl, sendEl, badgeEl;

  function buildUI() {
    /* FAB (character button) */
    fabEl = document.createElement('button');
    fabEl.className = 'emi-fab';
    fabEl.type = 'button';
    fabEl.setAttribute('aria-label', 'Chat with Emi, our virtual assistant');
    fabEl.innerHTML = ''
      + '<span class="emi-tip">Chat with Emi</span>'
      + CHARACTER_SVG
      + '<span class="emi-badge" id="emiBadge">1</span>';
    document.body.appendChild(fabEl);

    /* Panel */
    panelEl = document.createElement('div');
    panelEl.className = 'emi-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-label', 'Emi chat assistant');
    panelEl.innerHTML = ''
      + '<div class="emi-head">'
      +   CHARACTER_SVG
      +   '<div class="emi-head-txt">'
      +     '<b>' + BOT_NAME + '</b>'
      +     '<small>Online · replies instantly</small>'
      +   '</div>'
      +   '<button class="emi-close" type="button" aria-label="Close chat">' + CLOSE_SVG + '</button>'
      + '</div>'
      + '<div class="emi-body" id="emiBody"></div>'
      + '<div class="emi-chips" id="emiChips"></div>'
      + '<div class="emi-foot">'
      +   '<input class="emi-input" id="emiInput" type="text" placeholder="Ask me anything…" autocomplete="off" aria-label="Type your message">'
      +   '<button class="emi-send" id="emiSend" type="button" aria-label="Send">' + SEND_SVG + '</button>'
      + '</div>'
      + '<div class="emi-note">AI-assisted · For anything urgent, <a href="https://wa.me/' + WA_NUMBER + '" target="_blank" rel="noopener">WhatsApp us</a></div>';
    document.body.appendChild(panelEl);

    bodyEl   = document.getElementById('emiBody');
    chipsEl  = document.getElementById('emiChips');
    inputEl  = document.getElementById('emiInput');
    sendEl   = document.getElementById('emiSend');
    badgeEl  = document.getElementById('emiBadge');

    /* Events */
    sendEl.addEventListener('click', submitInput);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitInput(); }
    });

    /* Global click handling — robust, works even if the panel re-renders */
    document.addEventListener('click', function (e) {
      var t = e.target;

      /* Clicked the close button (or anything inside it) */
      if (t.closest && t.closest('.emi-close')) {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }

      /* Clicked the FAB — toggle open/close */
      if (t.closest && t.closest('.emi-fab')) {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen) { close(); } else { open(); }
        return;
      }

      /* Click inside the panel (but not the close button) — do nothing */
      if (panelEl && panelEl.contains(t)) return;

      /* Click anywhere else while open — close */
      if (isOpen) close();
    }, true);

    /* ESC key closes */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) { e.preventDefault(); close(); }
    });
  }

  /* ═════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════ */
  function renderMessages() {
    bodyEl.innerHTML = '';
    messages.forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'emi-msg ' + (m.role === 'user' ? 'user' : 'bot');
      div.textContent = m.text;
      bodyEl.appendChild(div);
    });
    scrollBottom();
  }

  function appendMessage(role, text) {
    messages.push({ role: role, text: text, ts: Date.now() });
    saveHistory();

    var div = document.createElement('div');
    div.className = 'emi-msg ' + (role === 'user' ? 'user' : 'bot');
    div.textContent = text;
    bodyEl.appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    var t = document.createElement('div');
    t.className = 'emi-typing';
    t.id = 'emiTyping';
    t.innerHTML = '<span></span><span></span><span></span>';
    bodyEl.appendChild(t);
    scrollBottom();
  }
  function hideTyping() {
    var t = document.getElementById('emiTyping');
    if (t) t.remove();
  }

  function renderChips(chips) {
    chipsEl.innerHTML = '';
    if (!chips || !chips.length) { chipsEl.style.display = 'none'; return; }
    chipsEl.style.display = 'flex';
    chips.forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'emi-chip';
      b.textContent = label;
      b.addEventListener('click', function () { handleChip(label); });
      chipsEl.appendChild(b);
    });
  }

  function scrollBottom() {
    requestAnimationFrame(function () {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    });
  }

  /* ═════════════════════════════════════════════════════════════════
     INTERACTION
     ═════════════════════════════════════════════════════════════════ */
  function handleChip(label) {
    var map = {
      'Show me services'   : 'services',
      'Services'           : 'services',
      'Other services'     : 'services',
      'Pricing'            : 'pricing',
      'Website pricing'    : 'how much for a website',
      'App pricing'        : 'how much for a mobile app',
      'Get a quote'        : 'i want a quote',
      'Open quote form'    : function () { window.location.href = 'index.html#quote'; },
      'Where are you?'     : 'where are you located',
      'Contact us'         : 'how do I contact you',
      'Talk to a human'    : 'talk to a human',
      'WhatsApp a human'   : function () { openWhatsApp('Hi Em\'s Tech, I have been redirected by EMI I\'d like to speak to someone about '); },
      'WhatsApp us'        : function () { openWhatsApp('Hi Em\'s Tech, I would like to enquire about '); },
      'WhatsApp now'       : function () { openWhatsApp('Hi Em\'s Tech, I would like to enquire about.'); },
      'Call now'           : function () { window.location.href = 'tel:+254795716730'; },
      'Open in Maps'       : function () { window.open('https://maps.google.com/?q=Kimbo,+Ruiru,+Kenya', '_blank'); },
      'About the company'  : 'tell me about the company',
      'Reviews'            : 'what do clients say',
      'Website Design'     : 'how much for website design',
      'Graphics Designs'   : 'how much for graphics design',
      'Resume CV'          : 'how much for a resume cv',
      'Thesis help'        : 'thesis project help',
      'Automation systems' : 'how much for work automation',
      'Get a quote'        : 'i want a quote'
    };

    var target = map[label];
    if (typeof target === 'function') { target(); return; }
    if (typeof target === 'string') { send(target); }
    else { send(label); }
  }

  function openWhatsApp(text) {
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  }

  function submitInput() {
    var v = inputEl.value.trim();
    if (!v) return;
    inputEl.value = '';
    send(v);
  }

  function send(text) {
    appendMessage('user', text);
    renderChips([]);
    showTyping();

    /* Simulate natural typing delay based on reply length */
    var reply = respond(text);
    var delay = Math.min(900, 350 + Math.min(reply.text.length * 6, 550));

    setTimeout(function () {
      hideTyping();
      appendMessage('bot', reply.text);
      renderChips(reply.chips || []);
    }, delay);
  }

  /* ═════════════════════════════════════════════════════════════════
     OPEN / CLOSE
     ═════════════════════════════════════════════════════════════════ */
  function open() {
    if (isOpen) return;
    isOpen = true;
    panelEl.classList.add('open');
    if (badgeEl) badgeEl.classList.add('hide');
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}

    /* First-time greeting */
    if (!messages.length) {
      setTimeout(function () {
        showTyping();
        setTimeout(function () {
          hideTyping();
          appendMessage('bot', greeting());
          renderChips(['Services', 'Pricing', 'Get a quote', 'Where are you?']);
        }, 500);
      }, 220);
    }

    setTimeout(function () { inputEl.focus(); }, 380);
  }

  function close() {
    isOpen = false;
    panelEl.classList.remove('open');
    if (inputEl && document.activeElement === inputEl) inputEl.blur();
    if (badgeEl) badgeEl.classList.add('hide');
  }

  /* ═════════════════════════════════════════════════════════════════
     INIT
     ═════════════════════════════════════════════════════════════════ */
  function init() {
    injectCSS();
    buildUI();
    loadHistory();
    renderMessages();

    /* Greet the user with the badge on first visit this session */
    try {
      if (!sessionStorage.getItem(SESSION_KEY) && badgeEl) {
        setTimeout(function () {
          if (!isOpen) fabEl.classList.add('emi-bounce-in');
        }, 1800);
      } else if (badgeEl) {
        badgeEl.classList.add('hide');
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Public API */
  window.EmiBot = {
    open: open,
    close: close,
    reset: function () {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
      messages = [];
      renderMessages();
    }
  };
})();