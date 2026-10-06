// BK Studio — shared site script
const projects = [
  {id:'porsche924', title:'PORSCHE 924', category:'Fotografi', year:'2026', span:'p1', summary:'Fotografi af en klassisk Porsche 924 — et privat projekt, hvor vi fokuserede på detaljer, linjer og bilens rå, tidløse stil.', cover:'images/porsche924/DSC03359.webp', hero:'images/porsche924/DSC03358.webp', location:'Danmark', originLogo:'images/logo/Porsche_Logo.jpg', gallery:[
    'images/porsche924/DSC03358.webp','images/porsche924/DSC03359.webp','images/porsche924/DSC03308.webp','images/porsche924/DSC03314.webp','images/porsche924/DSC03315.webp','images/porsche924/DSC03317.webp','images/porsche924/DSC03318.webp','images/porsche924/DSC03319.webp','images/porsche924/DSC03327.webp','images/porsche924/DSC03334.webp','images/porsche924/DSC03336.webp','images/porsche924/DSC03342.webp','images/porsche924/DSC03343.webp','images/porsche924/DSC03349.webp','images/porsche924/DSC03361.webp','images/porsche924/DSC03363.webp'
  ]},
  {id:'vildbjerg', latest:true, title:'VILDBJERG', category:'Fotografi / Content', year:'2026', span:'p2', summary:'Foto og content fra Vildbjerg Cup — vi dokumenterede stemningen, kampene og menneskerne på og omkring banen under turneringen.', cover:'images/vildbjerg/DSC04203.webp', hero:'images/vildbjerg/DSC04124.webp', location:'Vildbjerg', originLogo:'images/logo/vildbjerg_cup_logo.png', gallery:[
    'images/vildbjerg/DSC04124.webp','images/vildbjerg/DSC04164.webp','images/vildbjerg/DSC04133.webp','images/vildbjerg/DSC04138.webp','images/vildbjerg/DSC04178.webp','images/vildbjerg/DSC04183.webp','images/vildbjerg/DSC04193.webp','images/vildbjerg/DSC04197.webp','images/vildbjerg/DSC04203.webp','images/vildbjerg/DSC04209.webp','images/vildbjerg/DSC04225.webp','images/vildbjerg/DSC04234.webp','images/vildbjerg/DSC04240.webp','images/vildbjerg/DSC04394.webp','images/vildbjerg/DSC04403.webp'
  ]},
  {id:'thailand', title:'THAILAND', category:'Fotografi', year:'2026', span:'p3', home:false, summary:'Rejsefotografi fra Thailand — mennesker, steder og øjeblikke fanget undervejs.', cover:'images/thailand/DSC03429.webp', hero:'images/thailand/DSC03544.webp', location:'Thailand', gallery:[
    'images/thailand/DSC03429.webp','images/thailand/DSC03440.webp','images/thailand/DSC03544.webp','images/thailand/DSC03610.webp','images/thailand/DSC03712.webp','images/thailand/DSC03771.webp','images/thailand/DSC03801.webp','images/thailand/DSC03802.webp','images/thailand/DSC03819.webp','images/thailand/DSC03834.webp'
  ]},
];

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];



function useProjectImageFallback(img, projectId) {
  const p = projects.find(project => project.id === projectId);
  if (!p) return;
  const candidates = [p.cover, ...(p.gallery || [])].filter(Boolean);
  const current = img.dataset.fallbackIndex ? Number(img.dataset.fallbackIndex) : 0;
  const next = current + 1;
  if (next < candidates.length) {
    img.dataset.fallbackIndex = next;
    img.src = candidates[next];
  } else {
    img.classList.add('image-error');
  }
}

// Image loading guard: keeps the layout intact if an external image host is unavailable.
// The site does not replace your photography with stock images.
document.addEventListener('error', e => {
  const img = e.target;
  if (img?.tagName !== 'IMG') return;
  if (img.dataset.projectId) useProjectImageFallback(img, img.dataset.projectId);
  else img.classList.add('image-error');
}, true);

// Ingen egen intro på siderne: indlæsningen er forsidens logo-åbning (thru.js), og siden står færdig bagved, når den zoomer igennem.
const intro = $('#intro');
if (intro) { intro.style.transition = 'none'; intro.classList.add('hide'); requestAnimationFrame(() => { intro.style.transition = ''; }); }
// Overskrifterne begynder først at tone ind, når skrifttyperne er hentet (max. 2 sek.), så linjerne ikke skifter midt i animationen.
window.__fontsGate = true;
(function () {
  const go = () => document.body.classList.add('ready');
  if (!(document.fonts && document.fonts.load)) { go(); return; }
  let done = false; const fin = () => { if (!done) { done = true; go(); } };
  setTimeout(fin, 2000);
  Promise.all(['300 1em Inter', '400 1em Inter', '500 1em Inter', '600 1em Inter', '700 1em Inter'].map(f => document.fonts.load(f))).then(() => document.fonts.ready).then(fin, fin);
})();

// Mobile navigation
const menuBtn = $('#menuBtn');
const nav = $('#primaryNav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => { if (window.matchMedia('(min-width:821px)').matches) return; nav.classList.toggle('open'); });      // computer: se dropdown i fx.js
  $$('.nav-link').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
}

// Custom cursor
const cursor = $('#cursor');
if (cursor && !window.matchMedia('(any-hover:none)').matches) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursor.classList.add('show');
  });
  $$('.cursor-target, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('shrink'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('shrink'));
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('show'));
}

function cardHTML(p) {
  return `<a class="work-item ${p.span} reveal cursor-target" href="/arbejde#${p.id}" data-id="${p.id}">
    <div class="frame">
      <img src="${p.cover}" alt="${p.title} — ${p.category}" loading="lazy" decoding="async" onerror="useProjectImageFallback(this, '${p.id}')">
      <div class="veil"></div>
      ${p.originLogo ? `<div class="project-origin" aria-label="Logo for ${p.title}"><img src="${p.originLogo}" alt="${p.title} logo" onerror="this.parentElement.classList.add('logo-missing')"></div>` : ''}
      <div class="meta"><div><h3>${p.title}</h3><p class="cat">${p.category}</p></div><p class="yr">${p.year}</p></div>
    </div>
  </a>`;
}

// Render work grids. Home can set data-limit="3".
const workGrid = $('#workGrid');
if (workGrid) {
  const hasLimit = workGrid.dataset.limit !== undefined;
  // On the front page (data-limit set), skip projects marked home:false —
  // they only appear in the full project list on /arbejde.
  const source = hasLimit ? projects.filter(p => p.home !== false) : projects;
  const limit = Number(workGrid.dataset.limit || source.length);
  workGrid.innerHTML = source.slice(0, limit).map(cardHTML).join('');

  // On the work page, clicking a portfolio image opens the exact same project overlay
  // used by the selected-jobs cards on the front page. On other pages the normal link
  // still takes the visitor to the work page.
  workGrid.addEventListener('click', e => {
    const card = e.target.closest('.work-item');
    if (!card) return;
    const id = card.dataset.id;
    if (overlay && id) {
      e.preventDefault();
      openProject(id);
    }
  });
}

// Scroll reveal (must run AFTER work grid is rendered, so the injected
// .work-item cards are picked up too — otherwise they stay invisible)
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= .12) entry.target.classList.add('in');
      else if (!entry.isIntersecting && entry.boundingClientRect.top > 0) entry.target.classList.remove('in');   // baglæns, når man scroller op
    });
  }, {threshold:[0, .12]});
  $$('.reveal').forEach(el => io.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('in'));
}

// Project detail overlay on /arbejde
const overlay = $('#overlay');
const overlayClose = $('#overlayClose');
let scrollLock = 0, openId = null;

function openProject(id, pushHash=true) {
  const p = projects.find(project => project.id === id);
  if (!p || !overlay) return;
  openId = id;
  const med = src => src.replace('images/', 'images/med/');
  $('#ovCat').textContent = `${p.category}  /  ${p.location}  /  ${p.year}`;
  $('#ovTitle').textContent = p.title;
  const ovSummary = $('#ovSummary');
  if (ovSummary) ovSummary.textContent = p.summary || '';

  const idx0 = projects.findIndex(project => project.id === id);
  const pad = n => String(n).padStart(2, '0');
  const cnt = $('#ovCount'); if (cnt) cnt.textContent = `Projekt ${pad(idx0 + 1)} / ${pad(projects.length)}`;
  const meta = $('#ovMeta');
  if (meta) meta.innerHTML = [['Kategori', p.category], ['År', p.year], ['Sted', p.location], ['Billeder', String(p.gallery.length)]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  // hero: skiftende billeder
  const slides = $('#csSlides');
  if (slides) {
    const list = [p.hero, ...p.gallery.filter(g => g !== p.hero)].slice(0, 6);
    slides.innerHTML = list.map((src, i) => `<div class="cs-slide${i === 0 ? ' on' : ''}"><img src="${med(src)}" alt="${i === 0 ? p.title : ''}" decoding="async" onerror="this.classList.add('image-error')"></div>`).join('');
  }

  // dynamisk billedopstilling: blokke i skiftende layout med løbende tekstbånd imellem
  const gallery = $('#ovGallery');
  if (gallery) gallery.innerHTML = buildFlow(p, med);

  const index = projects.findIndex(project => project.id === id);
  const next = projects[(index + 1) % projects.length];
  $('#ovNextTitle').textContent = next.title;
  const nImg = $('#ovNextImg'); if (nImg) nImg.src = next.cover.replace('images/', 'images/thumbs/');
  $('#ovNext').onclick = () => openProject(next.id);

  overlay.scrollTop = 0;
  if (overlayClose) overlayClose.classList.remove('away');
  overlay.classList.add('open');
  overlay.dispatchEvent(new Event('projectchange'));
  scrollLock = window.scrollY;
  document.body.style.overflow = 'hidden';
  if (pushHash) { try { history.replaceState(null, '', `/arbejde#${id}`); } catch (e) {} }
}

// billedopstilling til projektsiden: hver blok bruger de næste billeder (liggende/stående efter behov)
function buildFlow(p, med) {
  const dim = src => (typeof ARCHIVE !== 'undefined' && ARCHIVE.find(a => a.s === src)) || { w: 3, h: 2 };
  const rest = p.gallery.slice(1).map(src => ({ src, land: dim(src).w >= dim(src).h }));
  const take = pref => {
    const i = rest.findIndex(r => pref === 'land' ? r.land : pref === 'port' ? !r.land : true);
    return rest.splice(i >= 0 ? i : 0, 1)[0];
  };
  const img = (r, cls, cap) => `<div class="cf-img ${cls}" data-par><img src="${med(r.src)}" alt="${p.title}" decoding="async" onerror="this.classList.add('image-error')">${cap ? `<span class="cf-cap" data-from="${cap.side}">${cap.text}</span>` : ''}</div>`;
  const band = (words, dir) => `<div class="cf-band" data-dir="${dir}" aria-hidden="true"><div class="cf-track">${Array(5).fill(words.map(w => `<span>${w}</span><i>/</i>`).join('')).join('')}</div></div>`;
  const T = p.title, C = p.category, Y = p.year, L = p.location;
  const patterns = ['wide', 'band1', 'duo', 'trio', 'band2', 'left', 'duo', 'right', 'band1', 'trio', 'wide', 'band2'];
  let html = '', n = 0, k = 0, pi = 0;
  const num = () => String(++n).padStart(2, '0');
  while (rest.length && pi < 40) {
    const pat = patterns[pi++ % patterns.length];
    if (pat === 'band1') { html += band([T, Y], 1); continue; }
    if (pat === 'band2') { html += band([C, L], -1); continue; }
    if (pat === 'wide') { const a = take('land'); html += `<div class="cf-block cf-wide">${img(a, '', { side: 'l', text: `${num()} — ${T}` })}</div>`; }
    else if (pat === 'duo') { const a = take('port'), b = rest.length ? take('land') : null; html += `<div class="cf-block cf-duo">${img(a, 'a', { side: 'l', text: `${num()} — ${T}` })}${b ? img(b, 'b', { side: 'r', text: `${num()} — ${Y}` }) : ''}</div>`; }
    else if (pat === 'trio') { const a = take('port'), b = rest.length ? take() : null, c = rest.length ? take('port') : null; html += `<div class="cf-block cf-trio">${img(a, 'a')}${b ? img(b, 'b') : ''}${c ? img(c, 'c', { side: 'r', text: `${num()} — ${L}` }) : ''}</div>`; }
    else { const a = take(); html += `<div class="cf-block cf-solo cf-${pat}">${img(a, '', null)}<div class="cf-word" data-from="${pat === 'left' ? 'r' : 'l'}"><b>${pat === 'left' ? C : L}</b><span>${num()} / ${String(p.gallery.length - 1).padStart(2, '0')}</span></div></div>`; }
    k++;
  }
  return html;
}

function closeProject() {
  if (!overlay) return;
  overlay.classList.remove('open');
  openId = null;
  document.body.style.overflow = '';
  try { history.replaceState(null, '', '/arbejde'); } catch (e) {}
  window.scrollTo(0, scrollLock);
}

if (overlay) {
  overlayClose?.addEventListener('click', closeProject);
  // tilbage-knappen: skjules, når man scroller ned i et projekt, og kommer frem igen, så snart man scroller opad
  if (overlayClose) {
    let lastSt = 0;
    overlay.addEventListener('scroll', () => {
      const st = overlay.scrollTop, d = st - lastSt;
      if (Math.abs(d) < 8) return;                                  // små rystelser ignoreres
      overlayClose.classList.toggle('away', st > 140 && d > 0);
      lastSt = st;
    }, { passive: true });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProject(); });
  const hash = location.hash.replace('#', '');
  if (hash && projects.some(p => p.id === hash)) setTimeout(() => openProject(hash, false), 80);
  // et link til et projekt, mens man allerede er på siden (fx et kort øverst på Arbejde), åbner projektet uden at genindlæse siden
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (h && h !== openId && projects.some(p => p.id === h)) openProject(h, false);
  });
}

// Mail: formularerne sender direkte til sidens egen Vercel-funktion (api/send-mail.js), som sender videre via Simply.coms SMTP-server.
// Der bruges ingen tredjepartstjeneste. Absolut sti, så det virker fra alle undersider.
const MAIL_ENDPOINT = '/api/send-mail';
const MAIL_ERROR_TEXT = 'Beskeden kunne ikke sendes lige nu. Prøv igen om lidt, eller skriv direkte til kontakt@bkstudio.dk.';
const SHOW_MAIL_DEBUG = false;  // true viser en kort teknisk årsag efter fejlbeskeden (kun til fejlsøgning)
const mailTech = (status, msg) => ' (Teknisk: ' + (status ? 'HTTP ' + status : 'ingen forbindelse') + (msg ? ' — ' + String(msg).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110) : '') + ')';

// Læser fetch-svaret som ren tekst og forsøger selv at parse det som JSON.
// Fejler parsingen, vises starten af det rå svar i stedet for en generisk
// "ugyldigt svar"-besked — så evt. serverfejl er til at se og forstå.
function parseMailResponse(res) {
  return res.text().then(raw => {
    try {
      const json = JSON.parse(raw);
      return { res, json };
    } catch (err) {
      const snippet = raw.trim().slice(0, 500) || '(tomt svar)';
      return { res, json: { success: false, message: `Uventet svar fra serveren (status ${res.status}): ${snippet}` } };
    }
  });
}

// Sender formularens felter til /api/send-mail som almindelig urlencoded POST (kompatibel med alle webservere/firewalls).
// Teknisk fejl (fx serverfejl eller ugyldigt svar) logges i konsollen, og den besøgende får en pæn besked.
function sendMail(data) {
  const body = new URLSearchParams();
  for (const [k, v] of data.entries()) body.append(k, v);
  return fetch(MAIL_ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body
  }).then(parseMailResponse).then(r => {
    const msg = (r.json && r.json.message) || '';
    if (!(r.res.ok && r.json && r.json.success) && !/^(Udfyld|Ugyldig|For mange)/.test(msg)) {
      const code = r.json && r.json.code;
      console.error('/api/send-mail fejlede — HTTP ' + r.res.status + (code ? ' [' + code + ']' : '') + ': ' + msg.slice(0, 400));
      r.json = { success: false, message: MAIL_ERROR_TEXT + (SHOW_MAIL_DEBUG ? mailTech(r.res.status, (code ? code + ' — ' : '') + msg) : '') };
    }
    return r;
  }).catch(err => {
    console.error('Kunne ikke nå /api/send-mail:', err);
    return { res: { ok: false, status: 0 }, json: { success: false, message: MAIL_ERROR_TEXT + (SHOW_MAIL_DEBUG ? mailTech(0, err && err.message) : '') } };
  });
}

// Sætter statustekst under en formular med en tydelig visuel stil, så en
// gennemført afsendelse er umulig at overse (ikke bare en lille, grå linje).
function setFormStatus(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove('is-success', 'is-error');
  if (kind) el.classList.add(kind === 'success' ? 'is-success' : 'is-error');
}

// Simple contact form -> /api/send-mail. No mailto fallback — the visitor's own
// mail client is never used; if sending fails, the error is shown instead.
const contactForm = $('#contactForm');
const contactStatus = $('#contactStatus');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(contactForm);

    // Honeypot: if a bot filled the hidden field, quietly pretend it worked.
    if ((data.get('website') || '').toString().trim() !== '') {
      contactForm.reset();
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.querySelector('span') : null;
    const originalLabel = submitLabel ? submitLabel.textContent : '';
    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sender…';
    if (contactStatus) setFormStatus(contactStatus, '');

    data.append('form_type', 'kontakt'); data.append('lang', window.BK_LANG || 'da');
    data.delete('website');

    sendMail(data)
      .then(({ res, json }) => {
        if (res.ok && json.success) {
          if (contactStatus) setFormStatus(contactStatus, 'Tak! Din besked er sendt — vi vender tilbage hurtigst muligt.', 'success');
          contactForm.reset();
        } else {
          if (contactStatus) setFormStatus(contactStatus, json.message || 'Beskeden kunne ikke sendes. Prøv igen senere.', 'error');
        }
      })
      .catch(err => {
        if (contactStatus) setFormStatus(contactStatus, `Der opstod en fejl ved afsendelsen: ${err.message || err}`, 'error');
      })
      .finally(() => {
        if (submitLabel) submitLabel.textContent = originalLabel;
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

// Book us — multi-step wizard. Sends to the same /api/send-mail endpoint.
const bookingForm = $('#bookingForm');
if (bookingForm) {
  const panes = $$('.wizard-pane', bookingForm);
  const backBtn = $('#wizardBack');
  const nextBtn = $('#wizardNext');
  const submitBtn = $('#wizardSubmit');
  const summaryBox = $('#wizardSummary');
  const bookStatus = $('#bookStatus');
  const stepNumEl = $('#wizardStepNum');
  const stepTotalEl = $('#wizardStepTotal');
  const fillEl = $('#wizardProgressFill');
  const dashEls = $$('#wizardDashes .wizard-dash, #wizardDashes .wiz-dash');
  let current = 1;
  const total = panes.length;
  if (stepTotalEl) stepTotalEl.textContent = total;

  function paneValid(n) {
    const pane = panes[n - 1];
    const required = $$('input[required], textarea[required], select[required]', pane);
    const seenRadioGroups = new Set();
    return required.every(field => {
      if (field.type === 'radio') {
        if (seenRadioGroups.has(field.name)) return true;
        seenRadioGroups.add(field.name);
        return $$(`input[name="${field.name}"]`, pane).some(r => r.checked);
      }
      if (field.value.trim() === '') return false;
      // Use the browser's native validation for things like e-mail format.
      return typeof field.checkValidity !== 'function' || field.checkValidity();
    });
  }

  function focusFirstInvalid(n) {
    const pane = panes[n - 1];
    const fields = $$('input[required], textarea[required], select[required]', pane);
    const radioGroups = new Set();
    const invalid = fields.find(field => {
      if (field.type === 'radio') {
        if (radioGroups.has(field.name)) return false;
        radioGroups.add(field.name);
        return !$$(`input[name="${field.name}"]`, pane).some(r => r.checked);
      }
      return field.value.trim() === '' || (typeof field.checkValidity === 'function' && !field.checkValidity());
    });
    if (invalid) invalid.focus({preventScroll:false});
  }

  function formValid() {
    for (let i = 1; i <= total; i++) {
      if (!paneValid(i)) return false;
    }
    return true;
  }

  function renderSummary() {
    if (!summaryBox) return;
    const data = new FormData(bookingForm);
    const rows = [
      ['Behov', data.get('behov')],
      ['Opgave', data.get('opgave')],
      ['Tidsramme', data.get('tidsramme')],
      ['Budget', data.get('budget')],
      ['Navn', data.get('navn')],
      ['E-mail', data.get('email')],
      ['Telefon', data.get('telefon')],
      ['Virksomhed', data.get('virksomhed')],
    ].filter(([, v]) => v && v.toString().trim() !== '');
    summaryBox.innerHTML = rows.map(([label, v]) => {
      const val = v.toString().trim();
      const short = val.length > 70 ? val.slice(0, 70) + '…' : val;
      return `<div class="wizard-summary-row"><span>${label}</span><span>${short}</span></div>`;
    }).join('');
  }

  function updateButtonStates() {
    const currentOk = paneValid(current);
    nextBtn.disabled = !currentOk;
    submitBtn.disabled = !(currentOk && formValid());
  }

  function goTo(n) {
    current = Math.min(Math.max(n, 1), total);
    panes.forEach((p, i) => p.classList.toggle('active', i === current - 1));
    if (stepNumEl) stepNumEl.textContent = current;
    if (fillEl) fillEl.style.width = `${(current / total) * 100}%`;
    if (dashEls.length) dashEls.forEach((d, i) => d.classList.toggle('done', i < current));
    backBtn.hidden = current === 1;
    const last = current === total;
    nextBtn.hidden = last;
    submitBtn.hidden = !last;
    if (last) renderSummary();
    if (bookStatus) setFormStatus(bookStatus, '');
    updateButtonStates();
  }

  nextBtn.addEventListener('click', () => {
    if (!paneValid(current)) {
      focusFirstInvalid(current);
      updateButtonStates();
      return;
    }
    goTo(current + 1);
  });

  backBtn.addEventListener('click', () => goTo(current - 1));

  bookingForm.addEventListener('input', updateButtonStates);
  bookingForm.addEventListener('change', updateButtonStates);

  bookingForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!formValid()) {
      if (bookStatus) setFormStatus(bookStatus, 'Udfyld alle felter for at sende bookingen.', 'error');
      updateButtonStates();
      return;
    }
    const data = new FormData(bookingForm);

    // Honeypot: if a bot filled the hidden field, quietly pretend it worked.
    if ((data.get('website') || '').toString().trim() !== '') {
      bookingForm.reset();
      goTo(1);
      return;
    }

    submitBtn.disabled = true;
    const submitLabel = submitBtn.querySelector('span');
    const originalLabel = submitLabel ? submitLabel.textContent : '';
    if (submitLabel) submitLabel.textContent = 'Sender…';
    if (bookStatus) setFormStatus(bookStatus, '');

    data.append('form_type', 'booking'); data.append('lang', window.BK_LANG || 'da');
    data.delete('website'); // honeypot field, already checked above

    sendMail(data)
      .then(({ res, json }) => {
        if (res.ok && json.success) {
          bookingForm.reset();
          goTo(1);                                                       // goTo rydder statusteksten, så bekræftelsen sættes bagefter
          if (bookStatus) { setFormStatus(bookStatus, 'Tak! Din forespørgsel er sendt — vi vender tilbage hurtigst muligt.', 'success'); bookStatus.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        } else {
          if (bookStatus) setFormStatus(bookStatus, json.message || 'Bookingen kunne ikke sendes. Prøv igen senere.', 'error');
        }
      })
      .catch(err => {
        if (bookStatus) setFormStatus(bookStatus, `Der opstod en fejl ved afsendelsen: ${err.message || err}`, 'error');
      })
      .finally(() => {
        if (submitLabel) submitLabel.textContent = originalLabel;
        updateButtonStates();
      });
  });

  goTo(1);
}

