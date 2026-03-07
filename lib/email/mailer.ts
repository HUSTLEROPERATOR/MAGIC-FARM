import nodemailer from 'nodemailer';
import { lookup } from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(lookup);

async function createTransporter() {
  const smtpHostname = process.env.SMTP_HOST || '';
  let resolvedHost = smtpHostname;
  try {
    const result = await dnsLookup(smtpHostname);
    resolvedHost = typeof result === 'string' ? result : result.address;
  } catch { /* usa hostname originale come fallback */ }

  return nodemailer.createTransport({
    host: resolvedHost,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { servername: smtpHostname, rejectUnauthorized: false },
  } as unknown as nodemailer.TransportOptions);
}

interface SendMagicLinkEmailParams {
  to: string;
  url: string;
  firstName?: string;
}

export async function sendMagicLinkEmail({ to, url, firstName }: SendMagicLinkEmailParams) {
  const from = process.env.SMTP_FROM || 'Magic Farm <noreply@magic-farm.local>';
  
  const subject = 'Your Magic Farm Login Link';
  const text = `Hi${firstName ? ' ' + firstName : ''},\n\nClick the link below to sign in to Magic Farm:\n\n${url}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b2c91;">Magic Farm</h2>
      <p>Hi${firstName ? ' ' + firstName : ''},</p>
      <p>Click the button below to sign in to Magic Farm:</p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #6b2c91; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Sign In</a>
      <p style="color: #666; font-size: 14px;">Or copy this link: ${url}</p>
      <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const transporter = await createTransporter();
    await transporter.sendMail({ from, to, subject, text, html });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

interface SendWelcomeEmailParams {
  to: string;
  firstName: string;
}

export async function sendWelcomeEmail({ to, firstName }: SendWelcomeEmailParams) {
  const from = process.env.SMTP_FROM || 'Magic Farm <noreply@magic-farm.local>';

  const subject = 'Welcome to Magic Farm!';
  const text = `Hi ${firstName},\n\nWelcome to Magic Farm! Your email has been verified.\n\nYou can now set your alias and join an event to start playing.\n\nEnjoy the magic!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b2c91;">Welcome to Magic Farm!</h2>
      <p>Hi ${firstName},</p>
      <p>Your email has been verified. You can now set your alias and join an event to start playing.</p>
      <p>Enjoy the magic!</p>
    </div>
  `;

  try {
    const transporter = await createTransporter();
    await transporter.sendMail({ from, to, subject, text, html });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
