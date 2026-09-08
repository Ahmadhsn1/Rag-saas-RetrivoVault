import nodemailer from "nodemailer";
import { env, isTestEnv } from "../config/env.js";

let transporter = null;

function getTransport() {
  if (transporter) return transporter;
  if (env.mail.smtpUrl) {
    transporter = nodemailer.createTransport(env.mail.smtpUrl);
  } else {
    // Dev/demo fallback: log emails to the console instead of sending.
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  if (isTestEnv) return { queued: true };

  const info = await getTransport().sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    html: html || `<pre>${text}</pre>`,
  });

  if (!env.mail.smtpUrl) {
    console.log(
      `\n[mailer:console] to=${to} subject="${subject}"\n${text}\n`,
    );
  }
  return info;
}

function shell(bodyHtml) {
  return `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0A0A0B;color:#F5F5F3;padding:32px">
  <div style="max-width:480px;margin:0 auto">
    <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#6C5CE7;margin:0 0 24px">Retrivo Vault</p>
    ${bodyHtml}
    <p style="font-size:11px;color:#A1A1AA;margin-top:32px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px">
      The research assistant that only knows what you've read. Your documents stay yours.
    </p>
  </div>
</div>`;
}

function button(url, label) {
  return `<p style="margin:24px 0"><a href="${url}" style="background:#E9E2D0;color:#0A0A0B;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">${label}</a></p>
  <p style="font-size:12px;color:#A1A1AA;word-break:break-all">${url}</p>`;
}

export function verifyEmailTemplate({ name, url }) {
  return {
    subject: "Confirm your email — Retrivo",
    text: `Hi ${name},\n\nYou're one click from your vault. Confirm your email:\n${url}\n\nThe link works for 24 hours. Didn't sign up? Ignore this — nothing was created without confirmation.`,
    html: shell(
      `<p style="font-size:15px;line-height:1.6">Hi ${name},</p>
       <p style="font-size:15px;line-height:1.6">You're one click from your vault. Confirm your email and start adding documents.</p>
       ${button(url, "Confirm email")}
       <p style="font-size:13px;color:#A1A1AA">The link works for 24 hours. If you didn't sign up, ignore this message.</p>`,
    ),
  };
}

export function resetPasswordTemplate({ name, url }) {
  return {
    subject: "Reset your password — Retrivo",
    text: `Hi ${name},\n\nUse this link to set a new password:\n${url}\n\nThe link works for 1 hour. Didn't ask for this? Ignore it — your password won't change and every signed-in session stays as it was.`,
    html: shell(
      `<p style="font-size:15px;line-height:1.6">Hi ${name},</p>
       <p style="font-size:15px;line-height:1.6">Use this link to set a new password.</p>
       ${button(url, "Set a new password")}
       <p style="font-size:13px;color:#A1A1AA">The link works for 1 hour. If you didn't ask for this, ignore it — nothing changes.</p>`,
    ),
  };
}
