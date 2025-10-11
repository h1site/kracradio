// src/lib/emailService.js
import { supabase } from './supabase';

const APP_NAME = 'KracRadio';
const APP_URL = process.env.REACT_APP_URL || 'http://localhost:3000';

/**
 * Generate a random token
 */
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a verification token in the database
 */
async function createVerificationToken(userId, email, tokenType = 'email_verification') {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

  console.log('🔑 Creating verification token for:', { userId, email, tokenType });

  // Add a small delay to ensure user is created in database
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { data, error } = await supabase
    .from('email_verification_tokens')
    .insert([{
      user_id: userId,
      token,
      token_type: tokenType,
      email,
      expires_at: expiresAt.toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating verification token:', {
      error,
      userId,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw error;
  }

  console.log('✅ Token created successfully:', data.id);
  return data;
}

/**
 * Get email HTML template for verification
 */
function getEmailVerificationTemplate(verificationUrl, lang = 'fr') {
  const translations = {
    fr: {
      subject: `Confirmez votre email - ${APP_NAME}`,
      greeting: 'Bonjour,',
      message: 'Merci de vous être inscrit sur KracRadio ! Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :',
      button: 'Confirmer mon email',
      validity: 'Ce lien est valide pendant 24 heures.',
      alternative: 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :',
      ignore: 'Si vous n\'avez pas créé de compte, vous pouvez ignorer cet email.',
      spam: '💡 Astuce : Vérifiez votre dossier spam si vous ne voyez pas nos emails.',
    },
    en: {
      subject: `Confirm your email - ${APP_NAME}`,
      greeting: 'Hello,',
      message: 'Thank you for signing up on KracRadio! To activate your account, please confirm your email address by clicking the button below:',
      button: 'Confirm my email',
      validity: 'This link is valid for 24 hours.',
      alternative: 'If the button doesn\'t work, copy and paste this link into your browser:',
      ignore: 'If you didn\'t create an account, you can ignore this email.',
      spam: '💡 Tip: Check your spam folder if you don\'t see our emails.',
    }
  };

  const t = translations[lang] || translations.fr;

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <img src="${APP_URL}/favicon.ico" alt="${APP_NAME}" width="64" height="64" style="display: block;">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a; text-align: center;">
                ${APP_NAME}
              </h1>

              <p style="margin: 0 0 10px; font-size: 16px; color: #1a1a1a;">
                ${t.greeting}
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; color: #4a4a4a; line-height: 1.5;">
                ${t.message}
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${verificationUrl}"
                       style="display: inline-block; padding: 14px 40px; background-color: #ff0000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; font-size: 14px; color: #666666;">
                ${t.validity}
              </p>

              <!-- Alternative link -->
              <div style="padding: 20px; background-color: #f9f9f9; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-size: 13px; color: #666666;">
                  ${t.alternative}
                </p>
                <p style="margin: 0; font-size: 12px; color: #999999; word-break: break-all;">
                  ${verificationUrl}
                </p>
              </div>

              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                ${t.ignore}
              </p>

              <p style="margin: 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 14px; color: #856404;">
                ${t.spam}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
${t.greeting}

${t.message}

${t.button}: ${verificationUrl}

${t.validity}

${t.ignore}

${t.spam}

© ${new Date().getFullYear()} ${APP_NAME}
    `
  };
}

/**
 * Get email HTML template for password reset
 */
function getPasswordResetTemplate(resetUrl, lang = 'fr') {
  const translations = {
    fr: {
      subject: `Réinitialisation de mot de passe - ${APP_NAME}`,
      greeting: 'Bonjour,',
      message: 'Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :',
      button: 'Réinitialiser mon mot de passe',
      validity: 'Ce lien est valide pendant 24 heures.',
      alternative: 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :',
      ignore: 'Si vous n\'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.',
      spam: '💡 Astuce : Vérifiez votre dossier spam si vous ne voyez pas nos emails.',
    },
    en: {
      subject: `Password Reset - ${APP_NAME}`,
      greeting: 'Hello,',
      message: 'You requested to reset your password. Click the button below to create a new password:',
      button: 'Reset my password',
      validity: 'This link is valid for 24 hours.',
      alternative: 'If the button doesn\'t work, copy and paste this link into your browser:',
      ignore: 'If you didn\'t request this reset, you can safely ignore this email.',
      spam: '💡 Tip: Check your spam folder if you don\'t see our emails.',
    }
  };

  const t = translations[lang] || translations.fr;

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <img src="${APP_URL}/favicon.ico" alt="${APP_NAME}" width="64" height="64" style="display: block;">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a; text-align: center;">
                ${APP_NAME}
              </h1>

              <p style="margin: 0 0 10px; font-size: 16px; color: #1a1a1a;">
                ${t.greeting}
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; color: #4a4a4a; line-height: 1.5;">
                ${t.message}
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 14px 40px; background-color: #ff0000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; font-size: 14px; color: #666666;">
                ${t.validity}
              </p>

              <!-- Alternative link -->
              <div style="padding: 20px; background-color: #f9f9f9; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-size: 13px; color: #666666;">
                  ${t.alternative}
                </p>
                <p style="margin: 0; font-size: 12px; color: #999999; word-break: break-all;">
                  ${resetUrl}
                </p>
              </div>

              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                ${t.ignore}
              </p>

              <p style="margin: 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 14px; color: #856404;">
                ${t.spam}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
${t.greeting}

${t.message}

${t.button}: ${resetUrl}

${t.validity}

${t.ignore}

${t.spam}

© ${new Date().getFullYear()} ${APP_NAME}
    `
  };
}

/**
 * Send verification email
 * NOTE: This requires a backend email service (Supabase Edge Function, SendGrid, etc.)
 * For now, this is a client-side placeholder that logs the email
 */
export async function sendVerificationEmail(userId, email, lang = 'fr') {
  try {
    // Create token in database
    const tokenData = await createVerificationToken(userId, email, 'email_verification');

    // Build verification URL
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${tokenData.token}`;

    // Get email template
    const emailTemplate = getEmailVerificationTemplate(verificationUrl, lang);

    // Log in development
    console.log('📧 Email Verification sending to:', email);
    console.log('Verification URL:', verificationUrl);
    console.log('Subject:', emailTemplate.subject);

    // Call Supabase Edge Function to send email via SMTP
    console.log('Calling send-email Edge Function...');
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      }
    });

    console.log('Edge Function response:', { data, error });

    if (error) {
      console.error('❌ Error calling send-email function:', {
        message: error.message,
        name: error.name,
        context: error.context,
        stringified: JSON.stringify(error, null, 2)
      });

      // Check if it's a "function not found" error
      if (error.message && error.message.includes('not found')) {
        throw new Error('La fonction send-email n\'est pas déployée. Exécutez: supabase functions deploy send-email');
      }

      throw error;
    }

    console.log('✅ Edge Function success, data:', data);

    if (!data?.success) {
      const errorMsg = data?.error || 'Failed to send email';
      console.error('❌ Email sending failed:', {
        error: errorMsg,
        fullData: JSON.stringify(data, null, 2)
      });
      throw new Error(errorMsg);
    }

    return {
      success: true,
      verificationUrl, // For development/testing
      message: 'Email de vérification envoyé'
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(userId, email, lang = 'fr') {
  try {
    // Create token in database
    const tokenData = await createVerificationToken(userId, email, 'password_reset');

    // Build reset URL
    const resetUrl = `${APP_URL}/auth/reset-password?token=${tokenData.token}`;

    // Get email template
    const emailTemplate = getPasswordResetTemplate(resetUrl, lang);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Password Reset email sending to:', email);
      console.log('Reset URL:', resetUrl);
      console.log('Subject:', emailTemplate.subject);
    }

    // Call Supabase Edge Function to send email via SMTP
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      }
    });

    if (error) {
      console.error('Error calling send-email function:', error);
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to send email');
    }

    return {
      success: true,
      resetUrl, // For development/testing
      message: 'Email de réinitialisation envoyé'
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Verify email with token
 */
export async function verifyEmailToken(token) {
  try {
    // Get token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'email_verification')
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Token invalide ou expiré');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Ce lien a expiré. Veuillez demander un nouveau lien.');
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Update user profile to mark email as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', tokenData.user_id);

    if (updateError) throw updateError;

    return {
      success: true,
      userId: tokenData.user_id,
      email: tokenData.email
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    throw error;
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token) {
  try {
    // Get token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'password_reset')
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Token invalide ou expiré');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Ce lien a expiré. Veuillez demander un nouveau lien.');
    }

    return {
      success: true,
      tokenId: tokenData.id,
      userId: tokenData.user_id,
      email: tokenData.email
    };
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    throw error;
  }
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenUsed(tokenId) {
  const { error } = await supabase
    .from('email_verification_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenId);

  if (error) throw error;
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('email_verified')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking email verification:', error);
    return false;
  }

  return data?.email_verified || false;
}
