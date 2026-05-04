const { QueryTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');
const { sendVerificationEmail } = require('../services/emailService');

/**
 * Génère un code de vérification 6 caractères aléatoire
 */
function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Envoie un email de vérification à l'utilisateur
 */
async function sendVerificationCodeEmail(req, res) {
  try {
    const userId = Number(req.user.id);
    const email = req.user.email;

    // Génère un nouveau code de vérification
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Sauvegarde le code dans la base de données
    await withDbTimeout(
      sequelize.query(
        `UPDATE \`User\` SET email_verification_code = :code, email_verification_expires = :expires 
         WHERE id = :userId`,
        {
          replacements: {
            userId,
            code: verificationCode,
            expires: expiresAt,
          },
        }
      ),
      'update verification code'
    );

    // Envoie l'email
    const result = await sendVerificationEmail(email, verificationCode);

    if (result.success) {
      return res.json({
        message: 'Verification email sent successfully',
        email: email,
      });
    } else {
      return res.status(500).json({
        message: 'Failed to send verification email',
        error: result.error,
      });
    }
  } catch (error) {
    return sendDbError(res, error, 'Failed to send verification email');
  }
}

/**
 * Vérifie le code de vérification fourni par l'utilisateur
 */
async function verifyEmailCode(req, res) {
  try {
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const userId = Number(req.user.id);

    // Récupère l'utilisateur et vérifie le code
    const rows = await withDbTimeout(
      sequelize.query(
        `SELECT id, email_verification_code, email_verification_expires, email_verified 
         FROM \`User\` 
         WHERE id = :userId LIMIT 1`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      ),
      'get user verification code'
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Vérifie si le code est déjà vérifié
    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Vérifie le code et la date d'expiration
    if (user.email_verification_code !== code.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    // Met à jour l'utilisateur
    await withDbTimeout(
      sequelize.query(
        `UPDATE \`User\` SET email_verified = TRUE, email_verification_code = NULL, email_verification_expires = NULL
         WHERE id = :userId`,
        {
          replacements: { userId },
        }
      ),
      'verify user email'
    );

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    return sendDbError(res, error, 'Failed to verify email code');
  }
}

/**
 * Récupère le statut de vérification d'email de l'utilisateur
 */
async function getVerificationStatus(req, res) {
  try {
    const userId = Number(req.user.id);

    const rows = await withDbTimeout(
      sequelize.query(
        `SELECT email, email_verified FROM \`User\` WHERE id = :userId LIMIT 1`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      ),
      'get user verification status'
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    return res.json({
      email: user.email,
      verified: Boolean(user.email_verified),
    });
  } catch (error) {
    return sendDbError(res, error, 'Failed to get verification status');
  }
}

module.exports = {
  sendVerificationCodeEmail,
  verifyEmailCode,
  getVerificationStatus,
  generateVerificationCode,
};
