import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendOpenStageApprovalEmailParams {
  to: string;
  stageName: string;
  realName: string;
}

export async function sendOpenStageApprovalEmail({
  to,
  stageName,
  realName,
}: SendOpenStageApprovalEmailParams) {
  const from = process.env.SMTP_FROM || 'Magic Farm <noreply@magic-farm.local>';

  const subject = '✨ Candidatura Approvata - Palco Aperto Magico';
  const text = `Ciao ${realName},\n\nSiamo felici di informarti che la tua candidatura come "${stageName}" per il Palco Aperto Magico è stata approvata!\n\nVerrai contattato a breve con i dettagli sulla serata e le informazioni logistiche.\n\nPrepara il tuo numero migliore e preparati a stupire il pubblico!\n\nA presto sul palco,\nIl Team di Magic Farm`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%); color: white; padding: 40px 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #d4af37; font-size: 36px; margin: 0;">✨ Palco Aperto Magico ✨</h1>
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.3);">
        <h2 style="color: #d4af37; margin-top: 0;">Candidatura Approvata!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Ciao <strong>${realName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          Siamo felici di informarti che la tua candidatura come <strong style="color: #9d4edd;">"${stageName}"</strong> 
          per il Palco Aperto Magico è stata <strong style="color: #4ade80;">approvata</strong>!
        </p>
        
        <div style="background: rgba(157, 78, 221, 0.2); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9d4edd;">
          <p style="margin: 0; font-size: 14px; line-height: 1.6;">
            Verrai contattato a breve con i dettagli sulla serata e le informazioni logistiche.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">
          Prepara il tuo numero migliore e preparati a stupire il pubblico!
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
          <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin: 0;">
            A presto sul palco,
          </p>
          <p style="font-size: 14px; color: #d4af37; margin: 5px 0 0 0;">
            <strong>Il Team di Magic Farm</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
        <p>Questa è una email automatica. Per qualsiasi domanda, rispondi a questa email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error };
  }
}
