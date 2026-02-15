import { SendVerificationRequestParams } from 'next-auth/providers/email';
import nodemailer from 'nodemailer';

export async function sendVerificationRequest({
  identifier: email,
  url,
  provider: { server, from },
}: SendVerificationRequestParams) {
  // 🔧 DEV MODE: Log magic link invece di inviare email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('\n' + '='.repeat(80));
    console.log('🎩✨ MAGIC LINK (DEV MODE) ✨🎩');
    console.log('='.repeat(80));
    console.log(`📧 Email: ${email}`);
    console.log(`🔗 Link:  ${url}`);
    console.log('='.repeat(80) + '\n');
    return; // Skip email sending
  }

  const transport = nodemailer.createTransport(server);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Magic Farm - Accedi</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #1a0b2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(107, 44, 145, 0.3);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎩✨</div>
                    <h1 style="color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 2px;">MAGIC FARM</h1>
                    <p style="color: #9d4edd; font-size: 14px; margin: 8px 0 0; text-transform: uppercase; letter-spacing: 3px;">Enter the Mystery</p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, #6b2c91, transparent);">
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px 40px; text-align: center;">
                    <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px;">Il tuo Magic Link è pronto</h2>
                    <p style="color: #a0a0c0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                      Clicca il pulsante qui sotto per accedere a Magic Farm.<br>
                      Il link scadrà tra 24 ore.
                    </p>
                    
                    <!-- CTA Button -->
                    <a href="${url}" 
                       style="display: inline-block; background: linear-gradient(135deg, #6b2c91 0%, #9d4edd 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 1px; box-shadow: 0 8px 24px rgba(157, 78, 221, 0.4);">
                      ✨ Entra nel Magic ✨
                    </a>
                    
                    <p style="color: #6b6b8a; font-size: 12px; margin: 30px 0 0;">
                      Se non hai richiesto questo link, puoi ignorare questa email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.2);">
                    <p style="color: #6b6b8a; font-size: 12px; margin: 0; text-align: center;">
                      © ${new Date().getFullYear()} Magic Farm. Tutti i diritti riservati.<br>
                      <span style="color: #d4af37;">🔮</span> Where Magic Meets Competition <span style="color: #d4af37;">🔮</span>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
Magic Farm - Accedi

Clicca questo link per accedere a Magic Farm:
${url}

Il link scadrà tra 24 ore.

Se non hai richiesto questo link, puoi ignorare questa email.

© ${new Date().getFullYear()} Magic Farm
`;

  const result = await transport.sendMail({
    to: email,
    from,
    subject: '✨ Magic Farm - Il tuo Magic Link',
    text,
    html,
  });

  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email could not be sent to ${failed.join(', ')}`);
  }
}
