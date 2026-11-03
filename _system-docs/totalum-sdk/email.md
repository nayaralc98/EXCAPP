# E-mail — `totalum.email`

`totalum.email.send({ to, subject, html, text?, cc?, bcc?, replyTo?, from?: { name?, localPart? }, attachments?,
scheduledAt?, idempotencyKey? })` → `{ success: true, id, messageId, status: 'queued' }`. `to`/`cc`/`bcc`: one address
or an array, at most 50 recipients in all. HTML is sent exactly as given. `attachments`: at most 10, each
`{ filename, url }` (a public URL, e.g. a stored file's `fileUrl` or a PDF's `url`) or `{ filename, content }`
(base64). `totalum.email.get(id)` (the `id`, not `messageId`) → `{ status, events }` or `null`. Charged per recipient
(`/v1/pricing`, README). Use it; never install `resend`, `nodemailer` or `@sendgrid/*`.

Sender address: `p-<projectId>@mail.totalum-project.com`, shown with `from.name` (always pass the app's name). When the
project's main address is on `webapp-project.com` (Professional and Enterprise), mail goes out from
`p-<projectId>@mail.webapp-project.com` instead — automatic, nothing to change in code. A sender on the owner's own
domain (`noreply@theirbrand.com`) is not supported yet: say so if asked, never install another mail provider for it.

<!-- totalum-sdk:signatures email -->
| Call | Returns |
|---|---|
| `totalum.email.send({ to, subject, html?, text?, from?, replyTo?, cc?, bcc?, headers?, attachments?, tags?, scheduledAt?, idempotencyKey?, bulk? })` | `{ id, status: 'queued' \| 'sent', message, success, messageId, usage }` |
| `totalum.email.get(id)` | `{ id, from, to, subject, status, lastEventAt, events }` |
<!-- /totalum-sdk:signatures -->

## Recipe — tell the owner about a form submission (server action)

```ts
'use server';
import { totalum } from 'totalum-sdk';

import { site } from '@/lib/site';

export async function notifyOwner(name: string, email: string, message: string) {
  const to = process.env.TOTALUM_OWNER_EMAIL; // the owner's sign-in e-mail, preset on the preview and live
  if (!to) return; // empty: the app has no owner address, nothing to send (a staff page still lists it)
  try {
    await totalum.email.send({
      to,
      subject: `New contact from ${name}`,
      html: `<p><b>${escapeHtml(name)}</b> (${escapeHtml(email)})</p><p>${escapeHtml(message)}</p>`,
      replyTo: email,
      from: { name: site.name }, // always: without it the sender reads as the project id
    });
  } catch (err) {
    console.error('contact e-mail failed', err); // the submission itself is already saved
  }
}
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
```

- "Send me an e-mail" / "notify me": the owner's sign-in e-mail is `process.env.TOTALUM_OWNER_EMAIL` (preset; never
  ask for it); another address only when the prompt gives one. Empty: skip the send (as above), never invent an
  address, and say in your reply that the app has no owner e-mail yet: the owner can name one. Every public form or
  order (contact, quote, booking, shop order) e-mails the owner like this and/or, when the app has sign-in, lists on
  a staff page behind `isAdmin(user)`: the owner must see it.
- A report with a file: generate it first (`pdf.md`), then `attachments: [{ filename: 'report.pdf', url }]`.
- A daily digest: a cron job (`cron.md`) whose route builds the HTML and calls `send`.
- To test a send yourself, use `delivered@resend.dev` (Resend's test inbox), never a real person's address.

Errors: `DEV_RECIPIENT_NOT_ALLOWED` (the test environment only delivers to allowed addresses — keep the call),
`TOO_MANY_RECIPIENTS`, `INVALID_ATTACHMENT_URL`, `EMAIL_SEND_FAILED`, `EMAIL_RECIPIENT_SUPPRESSED`.
