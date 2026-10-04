/**
 * BK Studio — formularer → e-mail (Vercel Serverless Function)
 *
 * Kontaktformularen og booking-guiden sender til  POST /api/send-mail.
 * Funktionen sender mailen via Simply.coms SMTP-server (smtp.simply.com, port 587, STARTTLS)
 * med adgangskoden fra Vercels miljøvariabler — ingen tredjepartstjeneste og ingen adgangskode i koden.
 *
 * Miljøvariabler (Vercel → Project → Settings → Environment Variables):
 *   SMTP_USER        påkrævet   fx kontakt@bkstudio.dk (den fulde mailadresse)
 *   SMTP_PASS        påkrævet   adgangskoden til mailadressen hos Simply.com
 *   MAIL_TO          valgfri    hvor henvendelserne sendes hen (standard: SMTP_USER)
 *   MAIL_FROM        valgfri    afsenderadresse (standard: SMTP_USER; skal være en adresse hos Simply.com)
 *   SMTP_HOST        valgfri    standard: smtp.simply.com   (websmtp.simply.com virker KUN fra Simply.coms egne webservere)
 *   SMTP_PORT        valgfri    standard: 587
 *   ALLOWED_ORIGINS  valgfri    kommasepareret, standard: https://bkstudio.dk,https://www.bkstudio.dk
 *   CHECK_TOKEN      valgfri    slår kontrol-adressen til: /api/send-mail?check=<token>  (se README-MAIL.md)
 *
 *   Bekræftelsesmail til den besøgende (sendes efter, at henvendelsen er sendt til jer):
 *   AUTOREPLY            valgfri    "off" slår bekræftelsesmailen fra (standard: slået til)
 *   AUTOREPLY_REPLY_TO   valgfri    hvem der svarer, når kunden trykker "Svar" (fx valdemar@bkstudio.dk; standard: første adresse i MAIL_TO)
 *   AUTOREPLY_FROM_NAME  valgfri    navn i afsenderfeltet (standard: BK Studio)
 *   SITE_URL             valgfri    standard: https://www.bkstudio.dk  (bruges til logo og links i mailen)
 */
'use strict';
const nodemailer = require('nodemailer');

const MAX = { navn: 120, email: 200, telefon: 60, virksomhed: 160, besked: 5000, behov: 120, opgave: 5000, tidsramme: 200, budget: 200 };
const FORM_TYPES = ['kontakt', 'booking'];
const MSG_FAIL = 'Beskeden kunne ikke sendes lige nu. Prøv igen senere.';

// Enkel begrænsning pr. IP (best effort: gælder pr. kørende funktionsinstans)
const hits = new Map();
function tooMany(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 6;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some(t => now - t < win)) hits.delete(k);
  return arr.length > max;
}

const line = (v, max) => String(v == null ? '' : v).replace(/[\r\n\u0000]+/g, ' ').trim().slice(0, max || 200);           // enkeltlinje: ingen linjeskift (header injection)
const text = (v, max) => String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim().slice(0, max || 5000);
const emailOk = e => e.length <= MAX.email && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/.test(e);

function reply(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  const s = Buffer.isBuffer(b) ? b.toString('utf8') : (typeof b === 'string' ? b : '');
  if (!s) return {};
  try { return JSON.parse(s); } catch (e) { /* ikke JSON */ }
  return Object.fromEntries(new URLSearchParams(s));
}

function makeTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.simply.com',
    port,
    secure: port === 465,
    requireTLS: port !== 465,                                   // STARTTLS på port 587
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

function safeErr(err) {                                         // aldrig adgangskoder eller serverlog i svaret
  return { code: String((err && (err.code || err.responseCode)) || 'SMTP'), message: String((err && err.message) || '').replace(/\s+/g, ' ').slice(0, 160) };
}


// ---------- E-mail-skabeloner ----------
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const nl2br = v => esc(v).replace(/\n/g, '<br>');
const FONT = "Arial,'Helvetica Neue',Helvetica,sans-serif";
const firstName = n => (String(n).trim().split(/\s+/)[0] || n);

function layout(site, preheader, inner) {
  return '<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>BK Studio</title></head>' +
    '<body style="margin:0;padding:0;background:#f1f1ee;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f1f1ee;font-size:1px;line-height:1px;">' + esc(preheader) + '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f1ee" style="background:#f1f1ee;"><tr><td align="center" style="padding:28px 14px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;border:1px solid #e3e3df;">' +
    '<tr><td bgcolor="#141414" style="background:#141414;border-radius:17px 17px 0 0;padding:30px 40px;"><a href="' + site + '" style="text-decoration:none;"><img src="' + site + '/images/email/logo-email-hvid.png" width="170" alt="BK Studio" style="display:block;border:0;outline:none;height:auto;width:170px;max-width:100%;color:#ffffff;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;"></a></td></tr>' +
    inner +
    '<tr><td style="padding:0 40px 34px 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e6e6e2;padding-top:20px;font-family:' + FONT + ';font-size:12px;line-height:1.6;color:#7a7a76;">' +
    'BK Studio &mdash; Foto, video og content<br>Midtsj&aelig;lland, Danmark &nbsp;&middot;&nbsp; <a href="' + site + '" style="color:#7a7a76;text-decoration:underline;">bkstudio.dk</a> &nbsp;&middot;&nbsp; <a href="https://www.instagram.com/bkstudiodk/" style="color:#7a7a76;text-decoration:underline;">@bkstudiodk</a>' +
    '</td></tr></table></td></tr></table></td></tr></table></body></html>';
}

const box = rows => '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f7f5;border-radius:14px;"><tr><td style="padding:20px 22px;">' + rows + '</td></tr></table>';
const field = (label, value) => '<div style="font-family:' + FONT + ';font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#7a7a76;padding-top:12px;">' + esc(label) + '</div>' +
  '<div style="font-family:' + FONT + ';font-size:15px;line-height:1.55;color:#141414;padding-top:3px;">' + nl2br(value) + '</div>';
const button = (href, label) => '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#141414" style="background:#141414;border-radius:14px;"><a href="' + href + '" style="display:inline-block;padding:15px 30px;font-family:' + FONT + ';font-size:13px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#ffffff;text-decoration:none;">' + esc(label) + '</a></td></tr></table>';

// Bekræftelse til den besøgende
function autoReply(site, d) {
  const fn = firstName(d.navn), isBooking = d.formType === 'booking';
  const lead = isBooking ? 'Tak for din foresp&oslash;rgsel' : 'Tak for din henvendelse';
  const preheader = 'Vi har modtaget din besked og vender tilbage hurtigst muligt.';
  const short = t => (t.length > 600 ? t.slice(0, 600).trim() + '…' : t);
  let summary = '';
  if (isBooking) {
    summary += field('Hvad skal du bruge', d.behov) + field('Opgaven', short(d.opgave));
    if (d.tidsramme !== '—') summary += field('Ønsket tidsramme', d.tidsramme);
    if (d.budget !== '—') summary += field('Budget', d.budget);
  } else summary += field('Din besked', short(d.besked));
  const inner =
    '<tr><td style="padding:34px 40px 0 40px;font-family:' + FONT + ';"><div style="font-size:30px;line-height:1.08;font-weight:800;letter-spacing:-0.8px;text-transform:uppercase;color:#141414;">' + lead + '.</div></td></tr>' +
    '<tr><td style="padding:20px 40px 0 40px;font-family:' + FONT + ';font-size:16px;line-height:1.65;color:#3a3a3a;">Hej ' + esc(fn) + ',<br><br>Vi har modtaget din ' + (isBooking ? 'foresp&oslash;rgsel' : 'besked') + ' og vender tilbage <b style="color:#141414;">hurtigst muligt</b>. Du beh&oslash;ver ikke g&oslash;re mere lige nu, og du kan altid svare direkte p&aring; denne mail, hvis du vil tilf&oslash;je noget.</td></tr>' +
    '<tr><td style="padding:26px 40px 0 40px;"><div style="font-family:' + FONT + ';font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#141414;padding-bottom:10px;">Det har du sendt til os</div>' + box(summary.replace(/padding-top:12px;/, 'padding-top:0;')) + '</td></tr>' +
    '<tr><td style="padding:28px 40px 0 40px;font-family:' + FONT + ';font-size:16px;line-height:1.65;color:#3a3a3a;">Mens du venter, kan du se, hvad vi har lavet:</td></tr>' +
    '<tr><td style="padding:14px 40px 0 40px;">' + button(site + '/arbejde', 'Se vores arbejde') + '</td></tr>' +
    '<tr><td style="padding:30px 40px 30px 40px;font-family:' + FONT + ';font-size:16px;line-height:1.65;color:#3a3a3a;">Venlig hilsen<br><b style="color:#141414;">Valdemar &amp; Basharat</b><br><span style="color:#7a7a76;">BK Studio</span></td></tr>';
  const text = 'Hej ' + fn + ',\n\nTak for din ' + (isBooking ? 'forespørgsel' : 'henvendelse') + '. Vi har modtaget den og vender tilbage hurtigst muligt. Du behøver ikke gøre mere lige nu, og du kan altid svare direkte på denne mail, hvis du vil tilføje noget.\n\n' +
    '--- Det har du sendt til os ---\n' + (isBooking ? 'Hvad skal du bruge: ' + d.behov + '\nOpgaven: ' + short(d.opgave) + '\nØnsket tidsramme: ' + d.tidsramme + '\nBudget: ' + d.budget : short(d.besked)) + '\n\n' +
    'Se vores arbejde: ' + site + '/arbejde\n\nVenlig hilsen\nValdemar & Basharat\nBK Studio — Foto, video og content\n' + site + '\n';
  return { subject: (isBooking ? 'Vi har modtaget din forespørgsel' : 'Tak for din henvendelse') + ' — BK Studio', html: layout(site, preheader, inner), text };
}

// Mailen til jer selv (overskuelig, med "Svar"-knap)
function notice(site, d) {
  const isBooking = d.formType === 'booking';
  let rows = '';
  if (isBooking) rows += field('Hvad skal du bruge', d.behov) + field('Opgaven', d.opgave) + field('Ønsket tidsramme', d.tidsramme) + field('Budget', d.budget);
  else rows += field('Besked', d.besked);
  const who = field('Navn', d.navn) + '<div style="font-family:' + FONT + ';font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#7a7a76;padding-top:12px;">E-mail</div><div style="font-family:' + FONT + ';font-size:15px;color:#141414;padding-top:3px;"><a href="mailto:' + esc(d.email) + '" style="color:#141414;">' + esc(d.email) + '</a></div>' + field('Telefon', d.telefon) + field('Virksomhed', d.virksomhed);
  const inner =
    '<tr><td style="padding:34px 40px 0 40px;font-family:' + FONT + ';"><div style="display:inline-block;background:#141414;color:#ffffff;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">' + (isBooking ? 'Ny booking' : 'Ny henvendelse') + '</div>' +
    '<div style="font-size:28px;line-height:1.1;font-weight:800;letter-spacing:-0.6px;text-transform:uppercase;color:#141414;padding-top:14px;">' + esc(d.navn) + '</div></td></tr>' +
    '<tr><td style="padding:22px 40px 0 40px;">' + box(rows.replace(/padding-top:12px;/, 'padding-top:0;')) + '</td></tr>' +
    '<tr><td style="padding:16px 40px 0 40px;">' + box(who.replace(/padding-top:12px;/, 'padding-top:0;')) + '</td></tr>' +
    '<tr><td style="padding:24px 40px 34px 40px;">' + button('mailto:' + encodeURIComponent(d.email).replace(/%40/g, '@') + '?subject=' + encodeURIComponent('Svar fra BK Studio'), 'Svar til ' + firstName(d.navn)) + '</td></tr>';
  return { html: layout(site, (isBooking ? 'Ny booking' : 'Ny henvendelse') + ' fra ' + d.navn, inner) };
}

module.exports = async function handler(req, res) {
  const cfgOk = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  const missing = ['SMTP_USER', 'SMTP_PASS'].filter(k => !process.env[k]);
  const envName = process.env.VERCEL_ENV || 'ukendt';                                // production / preview / development
  const url = new URL(req.url || '/', 'http://localhost');

  // ---- kontrol (kun hvis CHECK_TOKEN er sat): GET /api/send-mail?check=TOKEN[&send=1] ----
  if (req.method === 'GET' && process.env.CHECK_TOKEN && url.searchParams.get('check') === process.env.CHECK_TOKEN) {
    const out = { ok: false, node: process.version, host: process.env.SMTP_HOST || 'smtp.simply.com', port: Number(process.env.SMTP_PORT || 587), user: process.env.SMTP_USER || null, passwordSet: !!process.env.SMTP_PASS, to: process.env.MAIL_TO || process.env.SMTP_USER || null };
    if (!cfgOk) { out.environment = envName; out.missing = missing; out.error = { code: 'CONFIG', message: missing.join(' og ') + ' er ikke sat i miljøet "' + envName + '".' }; return reply(res, 500, out); }
    try {
      const t = makeTransport(); await t.verify(); out.ok = true; out.login = 'forbindelse, STARTTLS og login lykkedes';
      if (url.searchParams.get('send') === '1') {
        await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: out.to, subject: 'BK Studio — testmail fra Vercel', text: 'Hvis du læser denne mail, virker afsendelse fra hjemmesiden via Simply.com.\n\nTidspunkt: ' + new Date().toISOString() });
        out.testmail = 'sendt til ' + out.to;
      }
      return reply(res, 200, out);
    } catch (err) { out.error = safeErr(err); return reply(res, 502, out); }
  }

  if (req.method !== 'POST') return reply(res, 405, { success: false, message: 'Forkert metode.' });

  // ---- oprindelse: kun jeres egen side (og Vercel-forhåndsvisninger) ----
  const origin = req.headers.origin || '';
  if (origin) {
    const allowed = (process.env.ALLOWED_ORIGINS || 'https://bkstudio.dk,https://www.bkstudio.dk').split(',').map(s => s.trim()).filter(Boolean);
    let host = ''; try { host = new URL(origin).hostname; } catch (e) { /* ugyldig */ }
    const ok = allowed.includes(origin) || /\.vercel\.app$/.test(host) || host === 'localhost' || host === '127.0.0.1';
    if (!ok) return reply(res, 403, { success: false, message: 'Ugyldig forespørgsel.', code: 'ORIGIN' });
  }

  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'ukendt').split(',')[0].trim();
  if (tooMany(ip)) return reply(res, 429, { success: false, message: 'For mange forsøg. Prøv igen om lidt.', code: 'RATE' });

  const d = parseBody(req);

  // honeypot: usynligt felt; er det udfyldt, er det en robot — svar "ok" uden at sende noget
  if (line(d.website, 100) !== '') return reply(res, 200, { success: true });

  const formType = line(d.form_type || 'kontakt', 20);
  if (!FORM_TYPES.includes(formType)) return reply(res, 400, { success: false, message: 'Ugyldig formular.' });

  const navn = line(d.navn, MAX.navn), email = line(d.email, MAX.email);
  const telefon = line(d.telefon, MAX.telefon) || '—', virksomhed = line(d.virksomhed, MAX.virksomhed) || '—', besked = text(d.besked, MAX.besked) || '—';
  if (!navn || !email || !emailOk(email)) return reply(res, 400, { success: false, message: 'Udfyld navn og en gyldig e-mail.' });

  if (!cfgOk) { console.error('send-mail: mangler ' + missing.join(', ') + ' (miljø: ' + envName + ')'); return reply(res, 500, { success: false, message: 'Mailopsætningen mangler: ' + missing.join(' og ') + ' er ikke sat i miljøet "' + envName + '" (miljøvariabler er ikke sat, eller der mangler en ny udrulning).', code: 'CONFIG' }); }

  let subject, body, data = { formType, navn, email, telefon, virksomhed, besked };
  if (formType === 'booking') {
    const behov = line(d.behov, MAX.behov) || '—', opgave = text(d.opgave, MAX.opgave) || '—', tidsramme = line(d.tidsramme, MAX.tidsramme) || '—', budget = line(d.budget, MAX.budget) || '—';
    Object.assign(data, { behov, opgave, tidsramme, budget });
    subject = 'Ny booking — ' + navn;
    body = 'Hvad skal du bruge: ' + behov + '\n\n' + 'Opgaven:\n' + opgave + '\n\n' + 'Ønsket tidsramme: ' + tidsramme + '\n\n' + 'Budget: ' + budget + '\n\n' +
      'Navn: ' + navn + '\n' + 'E-mail: ' + email + '\n' + 'Telefon: ' + telefon + '\n' + 'Virksomhed: ' + virksomhed + '\n\n' + 'Andet:\n' + besked + '\n';
    data.besked = besked;
  } else {
    subject = 'Ny henvendelse — ' + navn;
    body = 'Navn: ' + navn + '\n' + 'E-mail: ' + email + '\n' + 'Telefon: ' + telefon + '\n' + 'Virksomhed: ' + virksomhed + '\n\n' + 'Besked:\n' + besked + '\n';
  }
  const site = (process.env.SITE_URL || 'https://www.bkstudio.dk').replace(/\/+$/, '');
  const fromAddr = process.env.MAIL_FROM || process.env.SMTP_USER, toAddr = process.env.MAIL_TO || process.env.SMTP_USER;

  try {
    const transport = makeTransport();
    // 1) Henvendelsen til jer
    await transport.sendMail({
      from: { name: 'BK Studio Website', address: fromAddr },
      to: toAddr,
      replyTo: { name: navn.replace(/["<>]/g, ''), address: email },
      subject, text: body, html: notice(site, data).html,
    });
    // 2) Bekræftelse til den besøgende (fejler den, påvirker det ikke, at henvendelsen er sendt)
    if (String(process.env.AUTOREPLY || '').toLowerCase() !== 'off') {
      try {
        const ar = autoReply(site, data);
        await transport.sendMail({
          from: { name: process.env.AUTOREPLY_FROM_NAME || 'BK Studio', address: fromAddr },
          to: { name: navn.replace(/["<>]/g, ''), address: email },
          replyTo: process.env.AUTOREPLY_REPLY_TO || String(toAddr).split(',')[0].trim(),
          subject: ar.subject, text: ar.text, html: ar.html,
          headers: { 'Auto-Submitted': 'auto-replied', 'X-Auto-Response-Suppress': 'All' },
        });
      } catch (err2) { const e2 = safeErr(err2); console.error('bekræftelsesmail fejlede:', e2.code, e2.message); }
    }
    return reply(res, 200, { success: true });
  } catch (err) {
    const e = safeErr(err);
    console.error('send-mail fejl:', e.code, e.message);                    // vises i Vercels logs (Project → Logs)
    return reply(res, 502, { success: false, message: MSG_FAIL, code: e.code });
  }
};
