// Kontaktformularen → e-mail via SMTP (samme opsætning som hovedsitets api/send-mail.js: Simply.com, STARTTLS).
// Er SMTP_USER/SMTP_PASS ikke sat, svarer ruten 503, og formularen siger ærligt, at intet blev sendt.
import nodemailer from 'nodemailer';
import { contactOptions } from '@/content/site';

export const runtime = 'nodejs';

const MAX = { name: 120, email: 200, type: 60, budget: 60, timeframe: 60, message: 5000 } as const;
const line = (v: unknown, max: number) => String(v ?? '').replace(/[\r\n\u0000]+/g, ' ').trim().slice(0, max);
const text = (v: unknown, max: number) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim().slice(0, max);
const emailOk = (e: string) => e.length <= MAX.email && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/.test(e);
const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// enkel begrænsning pr. IP (best effort pr. kørende instans)
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const arr = (hits.get(ip) ?? []).filter(t => now - t < win); arr.push(now); hits.set(ip, arr);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some(t => now - t < win)) hits.delete(k);
  return arr.length > 6;
}

const json = (status: number, body: object) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  if (tooMany(ip)) return json(429, { ok: false, error: 'Too many requests.' });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json(400, { ok: false, error: 'Invalid request.' }); }
  if (line(b.website, 200)) return json(200, { ok: true });                     // honningkrukke: bots får et stille "ok"

  const d = {
    name: line(b.name, MAX.name), email: line(b.email, MAX.email), type: line(b.type, MAX.type),
    budget: line(b.budget, MAX.budget), timeframe: line(b.timeframe, MAX.timeframe), message: text(b.message, MAX.message),
  };
  if (!d.name || !emailOk(d.email) || d.message.length < 10) return json(422, { ok: false, error: 'Please check the name, email and message fields.' });
  if (!contactOptions.types.includes(d.type as never)) return json(422, { ok: false, error: 'Please choose a project type.' });

  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!user || !pass) return json(503, { ok: false, error: 'not_configured' });

  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.simply.com', port, secure: port === 465, requireTLS: port !== 465,
    auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
  const rows: [string, string][] = [['Name', d.name], ['Email', d.email], ['Project type', d.type], ['Budget', d.budget || '—'], ['Timeframe', d.timeframe || '—']];
  try {
    await transport.sendMail({
      from: `"LIQUID website" <${process.env.MAIL_FROM || user}>`,
      to: process.env.MAIL_TO || user,
      replyTo: { name: d.name, address: d.email },
      subject: `New idea via LIQUID — ${d.type} — ${d.name}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${d.message}`,
      html: `<table cellpadding="6" style="font:14px/1.5 Helvetica,Arial,sans-serif">${rows.map(([k, v]) => `<tr><td style="color:#666">${k}</td><td>${esc(v)}</td></tr>`).join('')}</table>`
        + `<p style="font:15px/1.6 Helvetica,Arial,sans-serif;white-space:pre-wrap">${esc(d.message)}</p>`,
    });
    return json(200, { ok: true });
  } catch (err) {
    console.error('LIQUID contact: SMTP failed', (err as Error)?.message);
    return json(502, { ok: false, error: 'The message could not be sent right now. Please try again later.' });
  }
}
