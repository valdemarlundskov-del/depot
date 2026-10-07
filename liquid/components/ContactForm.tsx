'use client';
import { useId, useState, type FormEvent } from 'react';
import { contactOptions, site } from '@/content/site';
import { Arrow } from './Hero';

type Status = { kind: 'idle' | 'sending' | 'sent' | 'error'; msg?: string };
type Errors = Partial<Record<'name' | 'email' | 'type' | 'message', string>>;

const emailOk = (e: string) => /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/.test(e);

export function ContactForm() {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [errors, setErrors] = useState<Errors>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const err: Errors = {};
    if (!d.name?.trim()) err.name = 'Please tell us your name.';
    if (!emailOk(d.email?.trim() ?? '')) err.email = 'Please enter a valid email address.';
    if (!d.type) err.type = 'Choose the kind of project.';
    if ((d.message?.trim().length ?? 0) < 10) err.message = 'A few words about the idea, please (at least 10 characters).';
    setErrors(err);
    if (Object.keys(err).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(err)[0]}"]`)?.focus();
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) { setStatus({ kind: 'sent' }); form.reset(); return; }
      if (res.status === 503) setStatus({ kind: 'error', msg: `The form isn’t connected to a mailbox yet, so nothing was sent. Please write to ${site.email} instead.` });
      else if (res.status === 429) setStatus({ kind: 'error', msg: 'Too many messages in a short time. Please try again in a few minutes.' });
      else setStatus({ kind: 'error', msg: body.error || `Something went wrong and the message was not sent. Please try again, or write to ${site.email}.` });
    } catch {
      setStatus({ kind: 'error', msg: `No connection — the message was not sent. Please try again, or write to ${site.email}.` });
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className="cform-done" role="status">
        <p className="h2">Received.</p>
        <p className="lede">Thank you — we’ll read it properly and get back to you as soon as we can.</p>
        <button type="button" className="btn btn-line" onClick={() => setStatus({ kind: 'idle' })}>Send another</button>
      </div>
    );
  }

  const field = (name: keyof Errors) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-err` : undefined,
  });
  const Err = ({ name }: { name: keyof Errors }) => errors[name] ? <span id={`${id}-${name}-err`} className="cform-err">{errors[name]}</span> : null;

  return (
    <form className="cform" onSubmit={submit} noValidate aria-busy={status.kind === 'sending'}>
      <div className="cform-row2">
        <label className="cf">
          <span className="cf-l meta">Name</span>
          <input name="name" type="text" autoComplete="name" required maxLength={120} {...field('name')} />
          <Err name="name" />
        </label>
        <label className="cf">
          <span className="cf-l meta">Email</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} {...field('email')} />
          <Err name="email" />
        </label>
      </div>

      <fieldset className="cf cf-chips" {...field('type')}>
        <legend className="cf-l meta">Project type</legend>
        <div className="chips">
          {contactOptions.types.map(t => (
            <label key={t} className="chip"><input type="radio" name="type" value={t} /><span>{t}</span></label>
          ))}
        </div>
        <Err name="type" />
      </fieldset>

      <div className="cform-row2">
        <label className="cf">
          <span className="cf-l meta">Estimated budget <em>(optional)</em></span>
          <select name="budget" defaultValue="">
            <option value="">Select</option>
            {contactOptions.budgets.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label className="cf">
          <span className="cf-l meta">Preferred timeframe <em>(optional)</em></span>
          <select name="timeframe" defaultValue="">
            <option value="">Select</option>
            {contactOptions.timeframes.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
      </div>

      <label className="cf">
        <span className="cf-l meta">Message</span>
        <textarea name="message" rows={5} required maxLength={5000} placeholder="What are you making, and where will it live?" {...field('message')} />
        <Err name="message" />
      </label>

      <div className="hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="cform-foot">
        <button type="submit" className="btn btn-solid btn-big" disabled={status.kind === 'sending'} data-magnetic>
          <span>{status.kind === 'sending' ? 'Sending…' : 'Send the idea'}</span><Arrow />
        </button>
        <p className="meta muted">Or write directly: <a className="link-u" href={`mailto:${site.email}`}>{site.email}</a></p>
      </div>
      <p className={`cform-status${status.kind === 'error' ? ' is-err' : ''}`} role={status.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
        {status.kind === 'error' ? status.msg : status.kind === 'sending' ? 'Sending your message…' : ''}
      </p>
    </form>
  );
}
