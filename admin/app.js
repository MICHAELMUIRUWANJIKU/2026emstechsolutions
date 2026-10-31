/* admin/app.js — EM'S Tech Solutions Kenya — Admin Dashboard
 * Complete implementation. Aligned to:
 *  - admin/index.html (IDs: data-tab, .filter[data-status], #portfolioList,
 *    #testimonialsList, #modal/#modalPanel/#modalContent, #toast, etc.)
 *  - bookings columns: reference,name,email,phone,business,services,budget,
 *    timeline,existing_site,reference_sites,details,contact_pref,
 *    submitted_via,status,created_at
 *  - portfolio columns: title,category,category_label,description,image_url,
 *    display_order,published,created_at
 *  - testimonials columns: name,initials,role,quote,stars,display_order,
 *    published,created_at   (NO avatar_url)
 */
(function () {
  'use strict';

  /* ───────────────────────── Config guard ───────────────────────── */
  const cfg = window.ADMIN_CONFIG || {};
  const SUPABASE_URL = cfg.SUPABASE_URL;
  const SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || /PASTE/i.test(SUPABASE_ANON_KEY)) {
    document.body.innerHTML =
      '<div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:80px auto;padding:32px;border:1px solid #e2e6ec;border-radius:14px;text-align:center;">' +
        '<h2 style="margin:0 0 12px;">⚙️ Setup needed</h2>' +
        '<p style="color:#6b7280;line-height:1.6;">Open <code>admin/config.js</code> and paste your Supabase <b>anon</b> key into <code>SUPABASE_ANON_KEY</code>.<br>Get it from Supabase → Settings → API → anon public.</p>' +
      '</div>';
    return;
  }

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* ───────────────────────── Helpers ───────────────────────── */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso); if (isNaN(d)) return '—';
    return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso); if (isNaN(d)) return '—';
    return `${fmtDate(iso)}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  let toastTimer = null;
  function toast(msg, type = '') {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast' + (type ? ' ' + type : ''); }, 3200);
  }

  /* ───────────────────────── State ───────────────────────── */
  let currentUser = null;
  let userRole = 'editor';
  let bookings = [];
  let bookingFilter = 'all';
  let portfolioItems = [];
  let testimonialItems = [];

  /* ───────────────────────── Auth ───────────────────────── */
  async function initAuth() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { showLogin(); return; }
    onLoggedIn(session.user);
  }

  function showLogin() {
    $('#loginScreen').style.display = 'flex';
    $('#dashboard').style.display = 'none';
  }
  function showDashboard() {
    $('#loginScreen').style.display = 'none';
    $('#dashboard').style.display = 'grid';
  }
  function showLoginError(msg) {
    const el = $('#loginError');
    el.textContent = msg || '';
    el.classList.toggle('show', !!msg);
  }

  async function onLoggedIn(user) {
    currentUser = user;
    const { data, error } = await sb.from('admin_users').select('role').eq('email', user.email).maybeSingle();
    if (error || !data) {
      await sb.auth.signOut();
      showLogin();
      showLoginError('Your account is not registered as an admin. Contact the owner.');
      return;
    }
    userRole = data.role || 'editor';
    showDashboard();

    $('#userEmail').textContent = user.email;
    $('#userRole').textContent = userRole.toUpperCase();
    const initialEl = $('#userInitial');
    if (initialEl) initialEl.textContent = (user.email || 'M').charAt(0).toUpperCase();

    applyRolePermissions();
    loadBookings();
    loadPortfolio();
    loadTestimonials();
  }

  function applyRolePermissions() {
    document.documentElement.dataset.role = userRole;
    $$('[data-owner-only]').forEach(el => {
      el.style.display = userRole === 'owner' ? '' : 'none';
    });
  }

  // Login form
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoginError('');
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    const btn = $('#loginBtn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in…';
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.innerHTML = original;
    if (error) { showLoginError(error.message); return; }
    await onLoggedIn(data.user);
  });

  $('#logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.reload();
  });

  /* ───────────────────────── Navigation ───────────────────────── */
  function switchPanel(name) {
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
  }
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.tab));
  });

  /* ───────────────────────── Bookings ───────────────────────── */
  async function loadBookings() {
    const list = $('#bookingsList');
    list.innerHTML = '<div class="empty-state">Loading bookings…</div>';
    const { data, error } = await sb.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) {
      list.innerHTML = `<div class="empty-state">Could not load bookings.<br><small>${esc(error.message)}</small></div>`;
      return;
    }
    bookings = data || [];
    $('#bookingsCount').textContent = bookings.length;
    renderBookings();
  }

  function renderBookings() {
    const list = $('#bookingsList');
    const filtered = bookingFilter === 'all'
      ? bookings
      : bookings.filter(b => (b.status || 'new') === bookingFilter);

    if (!filtered.length) {
      list.innerHTML =
        '<div class="empty-state">' +
          '<b>No bookings here yet.</b><br>' +
          'When someone submits the quote form, it will appear here.' +
        '</div>';
      return;
    }

    list.innerHTML = filtered.map(bookingCardHTML).join('');
    bindBookingEvents();
    applyRolePermissions();
  }

  function bookingCardHTML(b) {
    const ref     = b.reference || (b.id ? b.id.slice(0, 8) : '—');
    const status  = b.status || 'new';
    const waNum   = (b.phone || '').replace(/\D/g, '');
    const waLink  = waNum
      ? 'https://wa.me/' + (waNum.startsWith('0') ? '254' + waNum.slice(1) : waNum) +
        '?text=' + encodeURIComponent(`Hi ${b.name}, following up on your EM'S Tech enquiry (${ref}).`)
      : null;
    const mailLink = b.email
      ? 'https://mail.google.com/mail/?view=cm&fs=1' +
        '&to=' + encodeURIComponent(b.email) +
        '&su=' + encodeURIComponent(`Re: Your EM'S Tech enquiry (${ref})`) +
        '&body=' + encodeURIComponent(`Hi ${b.name},\n\nThank you for reaching out to EM'S Tech Solutions Kenya.\n\n`)
      : null;

    const details = [
      ['Phone',           b.phone],
      ['Email',           b.email],
      ['Business',        b.business],
      ['Services',        b.services],
      ['Budget',          b.budget],
      ['Timeline',        b.timeline],
      ['Existing site',   b.existing_site],
      ['Reference sites', b.reference_sites],
      ['Contact via',     b.contact_pref],
      ['Submitted via',   b.submitted_via],
      ['Received',        fmtDateTime(b.created_at)],
    ].filter(([, v]) => v != null && v !== '');

    return `
      <div class="booking-card" data-id="${esc(b.id)}">
        <div class="booking-head">
          <div>
            <span class="badge">${esc(ref)}</span>
            <b>${esc(b.name || '—')}</b>
            <small>${esc(b.phone || '')}${b.phone && b.email ? ' · ' : ''}${esc(b.email || '')}</small>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <small class="muted">${fmtDate(b.created_at)}</small>
            <span class="status-pill status-${esc(status)}">${esc(status)}</span>
          </div>
        </div>
        <div class="booking-body">
          <div class="detail-grid">
            ${details.map(([k, v]) => `<div><small class="muted">${esc(k)}</small><div>${esc(v)}</div></div>`).join('')}
          </div>
          ${b.details ? `<div class="message-box"><small class="muted">Message</small><p>${esc(b.details)}</p></div>` : ''}
          <div class="booking-actions">
            <select data-action="status" class="status-select">
              ${['new','contacted','quoted','won','lost'].map(s =>
                `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            ${waLink   ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${waLink}">Reply WhatsApp</a>` : ''}
            ${mailLink ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${mailLink}">Reply Email</a>` : ''}
            <button class="btn btn-danger btn-sm" data-action="delete" data-owner-only>Delete</button>
          </div>
        </div>
      </div>`;
  }

  function bindBookingEvents() {
    $$('#bookingsList .booking-card').forEach(card => {
      const head = card.querySelector('.booking-head');
      const id   = card.dataset.id;
      head.addEventListener('click', (e) => {
        if (e.target.closest('select,button,a')) return;
        card.classList.toggle('open');
      });
      const sel = card.querySelector('.status-select');
      if (sel) sel.addEventListener('change', async () => {
        const newStatus = sel.value;
        const { error } = await sb.from('bookings').update({ status: newStatus }).eq('id', id);
        if (error) { toast('Could not update status.', 'error'); return; }
        const item = bookings.find(b => b.id === id);
        if (item) item.status = newStatus;
        const pill = card.querySelector('.status-pill');
        if (pill) { pill.className = 'status-pill status-' + newStatus; pill.textContent = newStatus; }
        toast('Status updated.', 'success');
      });
      const del = card.querySelector('[data-action="delete"]');
      if (del) del.addEventListener('click', async () => {
        if (userRole !== 'owner') return toast('Only the owner can delete bookings.', 'error');
        if (!confirm('Delete this booking permanently?')) return;
        const { error } = await sb.from('bookings').delete().eq('id', id);
        if (error) { toast('Could not delete.', 'error'); return; }
        bookings = bookings.filter(b => b.id !== id);
        $('#bookingsCount').textContent = bookings.length;
        renderBookings();
        toast('Booking deleted.', 'success');
      });
    });
  }

  // Filter pills
  $$('#bookingFilters .filter').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#bookingFilters .filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bookingFilter = btn.dataset.status || 'all';
      renderBookings();
    });
  });

  $('#refreshBookings').addEventListener('click', () => {
    loadBookings().then(() => toast('Bookings refreshed.', 'success'));
  });

  /* ───────────────────────── Portfolio ───────────────────────── */
  const PORTFOLIO_CATEGORIES = [
    { value: 'web',        label: 'Web Development' },
    { value: 'app',        label: 'Mobile App' },
    { value: 'design',     label: 'Graphics & Design' },
    { value: 'marketing',  label: 'Digital Marketing' },
    { value: 'seo',        label: 'SEO' },
    { value: 'automation', label: 'Automation' },
    { value: 'it',         label: 'IT Services' },
    { value: 'cyber',      label: 'Cyber Services' },
  ];

  async function loadPortfolio() {
    const grid = $('#portfolioList');
    grid.innerHTML = '<div class="empty-state">Loading portfolio…</div>';
    const { data, error } = await sb.from('portfolio').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) {
      grid.innerHTML = `<div class="empty-state">Could not load portfolio.<br><small>${esc(error.message)}</small></div>`;
      return;
    }
    portfolioItems = data || [];
    renderPortfolio();
  }

  function renderPortfolio() {
    const grid = $('#portfolioList');
    if (!portfolioItems.length) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<b>No projects yet.</b><br>' +
          'Click “New Project” to add your first portfolio card.' +
        '</div>';
      return;
    }
    grid.innerHTML = portfolioItems.map(p => `
      <div class="content-card ${p.published ? '' : 'unpublished'}" data-id="${esc(p.id)}">
        <div class="thumb">
          ${p.image_url
            ? `<img src="${esc(p.image_url)}" alt="${esc(p.title)}">`
            : `<div class="thumb-placeholder">${esc((p.title || '?').charAt(0))}</div>`}
        </div>
        <div class="card-body">
          <div class="card-badge">${esc(p.category_label || p.category || '')}</div>
          <h4>${esc(p.title)}</h4>
          <p>${esc(p.description || '')}</p>
          <div class="card-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
            <button class="btn btn-ghost btn-sm" data-action="toggle">
              ${p.published ? 'Unpublish' : 'Publish'}
            </button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-owner-only>Delete</button>
          </div>
        </div>
      </div>
    `).join('');
    bindPortfolioEvents();
    applyRolePermissions();
  }

  function bindPortfolioEvents() {
    $$('#portfolioList .content-card').forEach(card => {
      const id = card.dataset.id;
      const item = portfolioItems.find(p => p.id === id);
      card.querySelector('[data-action="edit"]').addEventListener('click', () => openPortfolioModal(item));
      card.querySelector('[data-action="toggle"]').addEventListener('click', async () => {
        const { error } = await sb.from('portfolio').update({ published: !item.published }).eq('id', id);
        if (error) return toast('Could not update.', 'error');
        item.published = !item.published;
        renderPortfolio();
        toast(item.published ? 'Published.' : 'Unpublished.', 'success');
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (userRole !== 'owner') return toast('Only the owner can delete.', 'error');
        if (!confirm('Delete this project?')) return;
        const { error } = await sb.from('portfolio').delete().eq('id', id);
        if (error) return toast('Could not delete.', 'error');
        portfolioItems = portfolioItems.filter(p => p.id !== id);
        renderPortfolio();
        toast('Deleted.', 'success');
      });
    });
  }

  $('#addPortfolioBtn').addEventListener('click', () => openPortfolioModal(null));

  function openPortfolioModal(item) {
    const isEdit = !!item;
    const p = item || { title:'', category:'web', category_label:'Web Development', description:'', image_url:'', display_order:0, published:true };

    openModal(isEdit ? 'Edit Project' : 'New Project', `
      <form id="portfolioForm" class="form">
        <label class="form-group">
          <span>Title</span>
          <input name="title" required value="${esc(p.title)}" />
        </label>
        <div class="form-row">
          <label class="form-group">
            <span>Category</span>
            <select name="category">
              ${PORTFOLIO_CATEGORIES.map(c =>
                `<option value="${c.value}" ${c.value === p.category ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </label>
          <label class="form-group">
            <span>Display order</span>
            <input type="number" name="display_order" value="${p.display_order ?? 0}" />
          </label>
        </div>
        <label class="form-group">
          <span>Description</span>
          <textarea name="description" rows="4">${esc(p.description || '')}</textarea>
        </label>
        <label class="form-group">
          <span>Image</span>
          <input type="file" name="image" accept="image/*" />
          <small class="muted">Uploads to portfolio-images bucket. Leave empty to keep existing.</small>
          <div id="imgPreview">
            ${p.image_url ? `<img src="${esc(p.image_url)}" alt="preview" style="max-width:120px;margin-top:8px;border-radius:8px">` : ''}
          </div>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" name="published" ${p.published ? 'checked' : ''} />
          <span>Published (visible on site)</span>
        </label>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create'}</button>
        </div>
      </form>
    `);

    const form = $('#portfolioForm');
    form.querySelector('[name="category"]').addEventListener('change', (e) => {
      const c = PORTFOLIO_CATEGORIES.find(x => x.value === e.target.value);
      form.dataset.label = c ? c.label : e.target.value;
    });
    form.dataset.label = p.category_label || 'Web Development';
    form.querySelector('[name="image"]').addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const url = URL.createObjectURL(file);
      $('#imgPreview').innerHTML = `<img src="${url}" alt="preview" style="max-width:120px;margin-top:8px;border-radius:8px">`;
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
      try {
        let imageUrl = p.image_url || null;
        const file = fd.get('image');
        if (file && file.size) {
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
          const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
          const { error: upErr } = await sb.storage.from('portfolio-images').upload(path, file, { upsert: false, contentType: file.type });
          if (upErr) throw upErr;
          const { data: pub } = sb.storage.from('portfolio-images').getPublicUrl(path);
          imageUrl = pub.publicUrl;
        }
        const cat = fd.get('category');
        const catLabel = (PORTFOLIO_CATEGORIES.find(c => c.value === cat) || {}).label || cat;
        const payload = {
          title: String(fd.get('title')).trim(),
          category: cat,
          category_label: catLabel,
          description: String(fd.get('description') || '').trim() || null,
          image_url: imageUrl,
          display_order: parseInt(fd.get('display_order') || '0', 10) || 0,
          published: fd.get('published') === 'on',
        };
        if (isEdit) {
          const { error } = await sb.from('portfolio').update(payload).eq('id', p.id);
          if (error) throw error;
          const idx = portfolioItems.findIndex(x => x.id === p.id);
          if (idx >= 0) portfolioItems[idx] = { ...portfolioItems[idx], ...payload };
        } else {
          const { data, error } = await sb.from('portfolio').insert(payload).select().single();
          if (error) throw error;
          portfolioItems.push(data);
        }
        portfolioItems.sort((a,b) => (a.display_order - b.display_order) || 0);
        closeModal();
        renderPortfolio();
        toast(isEdit ? 'Project saved.' : 'Project created.', 'success');
      } catch (err) {
        toast(err.message || 'Save failed.', 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = orig;
      }
    });
  }

  /* ───────────────────────── Testimonials ───────────────────────── */
  async function loadTestimonials() {
    const grid = $('#testimonialsList');
    grid.innerHTML = '<div class="empty-state">Loading testimonials…</div>';
    const { data, error } = await sb.from('testimonials').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) {
      grid.innerHTML = `<div class="empty-state">Could not load testimonials.<br><small>${esc(error.message)}</small></div>`;
      return;
    }
    testimonialItems = data || [];
    renderTestimonials();
  }

  function renderTestimonials() {
    const grid = $('#testimonialsList');
    if (!testimonialItems.length) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<b>No reviews yet.</b><br>' +
          'Click “New Review” to add your first testimonial.' +
        '</div>';
      return;
    }
    grid.innerHTML = testimonialItems.map(t => {
      const stars = Math.max(1, Math.min(5, t.stars || 5));
      const initials = t.initials || (t.name || '?').split(/\s+/).map(w => w.charAt(0)).slice(0,2).join('').toUpperCase();
      return `
        <div class="content-card ${t.published ? '' : 'unpublished'}" data-id="${esc(t.id)}">
          <div class="thumb thumb-avatar">
            <div class="avatar-circle">${esc(initials)}</div>
          </div>
          <div class="card-body">
            <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
            <h4>${esc(t.name)}</h4>
            <small class="muted">${esc(t.role || '')}</small>
            <p>${esc(t.quote)}</p>
            <div class="card-actions">
              <button class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
              <button class="btn btn-ghost btn-sm" data-action="toggle">
                ${t.published ? 'Unpublish' : 'Publish'}
              </button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-owner-only>Delete</button>
            </div>
          </div>
        </div>`;
    }).join('');
    bindTestimonialEvents();
    applyRolePermissions();
  }

  function bindTestimonialEvents() {
    $$('#testimonialsList .content-card').forEach(card => {
      const id = card.dataset.id;
      const item = testimonialItems.find(t => t.id === id);
      card.querySelector('[data-action="edit"]').addEventListener('click', () => openTestimonialModal(item));
      card.querySelector('[data-action="toggle"]').addEventListener('click', async () => {
        const { error } = await sb.from('testimonials').update({ published: !item.published }).eq('id', id);
        if (error) return toast('Could not update.', 'error');
        item.published = !item.published;
        renderTestimonials();
        toast(item.published ? 'Published.' : 'Unpublished.', 'success');
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (userRole !== 'owner') return toast('Only the owner can delete.', 'error');
        if (!confirm('Delete this review?')) return;
        const { error } = await sb.from('testimonials').delete().eq('id', id);
        if (error) return toast('Could not delete.', 'error');
        testimonialItems = testimonialItems.filter(t => t.id !== id);
        renderTestimonials();
        toast('Deleted.', 'success');
      });
    });
  }

  $('#addTestimonialBtn').addEventListener('click', () => openTestimonialModal(null));

  function openTestimonialModal(item) {
    const isEdit = !!item;
    const t = item || { name:'', initials:'', role:'', quote:'', stars:5, display_order:0, published:true };

    openModal(isEdit ? 'Edit Review' : 'New Review', `
      <form id="testimonialForm" class="form">
        <div class="form-row">
          <label class="form-group">
            <span>Name</span>
            <input name="name" required value="${esc(t.name)}" />
          </label>
          <label class="form-group">
            <span>Initials (optional)</span>
            <input name="initials" maxlength="3" value="${esc(t.initials || '')}" />
          </label>
        </div>
        <label class="form-group">
          <span>Role / Company (optional)</span>
          <input name="role" value="${esc(t.role || '')}" />
        </label>
        <label class="form-group">
          <span>Review</span>
          <textarea name="quote" rows="4" required>${esc(t.quote)}</textarea>
        </label>
        <div class="form-row">
          <label class="form-group">
            <span>Stars (1–5)</span>
            <input type="number" name="stars" min="1" max="5" value="${t.stars || 5}" required />
          </label>
          <label class="form-group">
            <span>Display order</span>
            <input type="number" name="display_order" value="${t.display_order ?? 0}" />
          </label>
        </div>
        <label class="checkbox-row">
          <input type="checkbox" name="published" ${t.published ? 'checked' : ''} />
          <span>Published (visible on site)</span>
        </label>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create'}</button>
        </div>
      </form>
    `);

    const form = $('#testimonialForm');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
      try {
        const payload = {
          name: String(fd.get('name')).trim(),
          initials: (String(fd.get('initials') || '').trim().toUpperCase()) || null,
          role: String(fd.get('role') || '').trim() || null,
          quote: String(fd.get('quote') || '').trim(),
          stars: Math.max(1, Math.min(5, parseInt(fd.get('stars') || '5', 10) || 5)),
          display_order: parseInt(fd.get('display_order') || '0', 10) || 0,
          published: fd.get('published') === 'on',
        };
        if (isEdit) {
          const { error } = await sb.from('testimonials').update(payload).eq('id', t.id);
          if (error) throw error;
          const idx = testimonialItems.findIndex(x => x.id === t.id);
          if (idx >= 0) testimonialItems[idx] = { ...testimonialItems[idx], ...payload };
        } else {
          const { data, error } = await sb.from('testimonials').insert(payload).select().single();
          if (error) throw error;
          testimonialItems.push(data);
        }
        testimonialItems.sort((a,b) => (a.display_order - b.display_order) || 0);
        closeModal();
        renderTestimonials();
        toast(isEdit ? 'Review saved.' : 'Review created.', 'success');
      } catch (err) {
        toast(err.message || 'Save failed.', 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = orig;
      }
    });
  }

  /* ───────────────────────── Shared modal ───────────────────────── */
  function openModal(title, bodyHTML) {
    $('#modalPanel').querySelector('#modalTitle')?.remove();
    const h = document.createElement('h3');
    h.id = 'modalTitle';
    h.textContent = title;
    $('#modalContent').innerHTML = '';
    $('#modalContent').appendChild(h);
    const wrap = document.createElement('div');
    wrap.innerHTML = bodyHTML;
    while (wrap.firstChild) $('#modalContent').appendChild(wrap.firstChild);
    $('#modal').classList.add('open');
  }
  function closeModal() { $('#modal').classList.remove('open'); }

  // Wire close triggers
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-modal]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#modal').classList.contains('open')) closeModal();
  });

  /* ───────────────────────── Boot ───────────────────────── */
  initAuth();
})();