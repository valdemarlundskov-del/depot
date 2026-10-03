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

  let subject, body;
  if (formType === 'booking') {
    const behov = line(d.behov, MAX.behov) || '—', opgave = text(d.opgave, MAX.opgave) || '—', tidsramme = line(d.tidsramme, MAX.tidsramme) || '—', budget = line(d.budget, MAX.budget) || '—';
    subject = 'Ny booking — ' + navn;
    body = 'Hvad skal du bruge: ' + behov + '\n\n' + 'Opgaven:\n' + opgave + '\n\n' + 'Ønsket tidsramme: ' + tidsramme + '\n\n' + 'Budget: ' + budget + '\n\n' +
      'Navn: ' + navn + '\n' + 'E-mail: ' + email + '\n' + 'Telefon: ' + telefon + '\n' + 'Virksomhed: ' + virksomhed + '\n\n' + 'Andet:\n' + besked + '\n';
  } else {
    subject = 'Ny henvendelse — ' + navn;
    body = 'Navn: ' + navn + '\n' + 'E-mail: ' + email + '\n' + 'Telefon: ' + telefon + '\n' + 'Virksomhed: ' + virksomhed + '\n\n' + 'Besked:\n' + besked + '\n';
  }

  try {
    await makeTransport().sendMail({
      from: { name: 'BK Studio Website', address: process.env.MAIL_FROM || process.env.SMTP_USER },
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      replyTo: { name: navn.replace(/["<>]/g, ''), address: email },
      subject, text: body,
    });
    return reply(res, 200, { success: true });
  } catch (err) {
    const e = safeErr(err);
    console.error('send-mail fejl:', e.code, e.message);                    // vises i Vercels logs (Project → Logs)
    return reply(res, 502, { success: false, message: MSG_FAIL, code: e.code });
  }
};
