const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false', // true par défaut (port 465 SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getSenderAddress() {
  // SMTP_FROM peut être "Nom <email>" ou juste "email"
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  // Si SMTP_FROM contient déjà un nom entre guillemets ou un <>, on l'utilise tel quel
  if (from.includes('<') || from.startsWith('"')) return from;
  return `"SortMyScene" <${from}>`;
}

async function sendVerificationEmail(email, verificationCode) {
  if (!isSmtpConfigured()) {
    console.warn('[emailService] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD missing).');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: email,
      subject: '[SortMyScene] Code de vérification email',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0c1324;color:#dce1fb;padding:32px;border-radius:12px">
          <h2 style="color:#22d3ee;margin-bottom:8px">Vérification de votre adresse email</h2>
          <p style="color:#94a3b8">Merci de vous être inscrit sur SortMyScene. Utilisez le code ci-dessous pour vérifier votre adresse email.</p>

          <div style="background:#1e293b;border:1px solid #334155;padding:24px;border-radius:8px;text-align:center;margin:24px 0">
            <p style="margin:0;color:#94a3b8;font-size:13px">Votre code de vérification :</p>
            <p style="margin:12px 0;font-size:36px;font-weight:bold;color:#22d3ee;letter-spacing:8px;font-family:monospace">
              ${verificationCode}
            </p>
            <p style="margin:0;color:#64748b;font-size:12px">Ce code expire dans 24 heures</p>
          </div>

          <p style="color:#94a3b8">Entrez ce code sur la page de vérification pour activer votre compte.</p>
          <p style="color:#475569;font-size:12px;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px">
            Si vous n'avez pas créé de compte, ignorez cet email.<br>
            &copy; 2025 SortMyScene
          </p>
        </div>
      `,
      text: `Votre code de vérification SortMyScene : ${verificationCode}\n\nCe code expire dans 24 heures.`,
    });

    console.log('[emailService] Verification email sent to', email, '—', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[emailService] Failed to send verification email:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendPasswordResetEmail(email, resetCode) {
  if (!isSmtpConfigured()) {
    console.warn('[emailService] SMTP not configured.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: email,
      subject: '[SortMyScene] Réinitialisation de mot de passe',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0c1324;color:#dce1fb;padding:32px;border-radius:12px">
          <h2 style="color:#22d3ee;margin-bottom:8px">Réinitialisation de mot de passe</h2>
          <p style="color:#94a3b8">Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>

          <div style="background:#1e293b;border:1px solid #334155;padding:24px;border-radius:8px;text-align:center;margin:24px 0">
            <p style="margin:0;color:#94a3b8;font-size:13px">Votre code de réinitialisation :</p>
            <p style="margin:12px 0;font-size:36px;font-weight:bold;color:#22d3ee;letter-spacing:8px;font-family:monospace">
              ${resetCode}
            </p>
            <p style="margin:0;color:#64748b;font-size:12px">Ce code expire dans 1 heure</p>
          </div>

          <p style="color:#94a3b8">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <p style="color:#475569;font-size:12px;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px">
            &copy; 2025 SortMyScene
          </p>
        </div>
      `,
      text: `Votre code de réinitialisation SortMyScene : ${resetCode}\n\nCe code expire dans 1 heure.`,
    });

    console.log('[emailService] Password reset email sent to', email, '—', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[emailService] Failed to send password reset email:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
