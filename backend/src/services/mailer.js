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

export function verifyEmailTemplate({ name, url }) {
  return {
    subject: "Verify your Retrivo Vault email",
    text: `Hi ${name},\n\nConfirm your email to activate your vault:\n${url}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this message.`,
  };
}

export function resetPasswordTemplate({ name, url }) {
  return {
    subject: "Reset your Retrivo Vault password",
    text: `Hi ${name},\n\nReset your password with this link:\n${url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this message.`,
  };
}
