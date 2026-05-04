const nodemailer = require('nodemailer');

/**
 * Configuration du service email
 * Utilise les variables d'environnement pour la configuration SMTP
 */
function createTransporter() {
  // Configuration pour le service d'email A2F
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.MAIL_A2F_HOST || process.env.SMTP_USER,
      pass: process.env.MAIL_A2F_PASS || process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Envoie un email de vérification avec un code 6 caractères
 */
async function sendVerificationEmail(email, verificationCode) {
  try {
    if (!process.env.MAIL_A2F_HOST || !process.env.MAIL_A2F_PASS) {
      console.warn('[emailService] MAIL_A2F_HOST or MAIL_A2F_PASS not configured. Email not sent.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const appName = 'SortMyScene';
    const appOrigin = process.env.APP_ORIGIN || 'https://sortmyscene.fr';

    const mailOptions = {
      from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `[${appName}] Email Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">Welcome to ${appName}</h2>
          <p>Thank you for registering! Please verify your email address to continue.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Your verification code is:</p>
            <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #06b6d4; letter-spacing: 5px;">
              ${verificationCode}
            </p>
            <p style="margin: 10px 0; color: #6b7280; font-size: 12px;">This code will expire in 24 hours</p>
          </div>

          <p>Enter this code in the verification form to complete your registration.</p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 12px;">
            <p>If you didn't create this account, please ignore this email.</p>
            <p>&copy; 2024 ${appName}. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
Welcome to ${appName}

Thank you for registering! Please verify your email address.

Your verification code is: ${verificationCode}

This code will expire in 24 hours.

If you didn't create this account, please ignore this email.

© 2024 ${appName}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[emailService] Verification email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[emailService] Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
async function sendPasswordResetEmail(email, resetCode) {
  try {
    if (!process.env.MAIL_A2F_HOST || !process.env.MAIL_A2F_PASS) {
      console.warn('[emailService] MAIL_A2F_HOST or MAIL_A2F_PASS not configured. Email not sent.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const appName = 'SortMyScene';
    const appOrigin = process.env.APP_ORIGIN || 'https://sortmyscene.fr';

    const mailOptions = {
      from: `"${appName}" <${process.env.MAIL_A2F_HOST || process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `[${appName}] Password Reset Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the code below to reset it.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Your password reset code is:</p>
            <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #06b6d4; letter-spacing: 5px;">
              ${resetCode}
            </p>
            <p style="margin: 10px 0; color: #6b7280; font-size: 12px;">This code will expire in 1 hour</p>
          </div>

          <p>Enter this code on the password reset page to set a new password.</p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 12px;">
            <p>If you didn't request a password reset, please ignore this email.</p>
            <p>&copy; 2024 ${appName}. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[emailService] Password reset email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[emailService] Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
