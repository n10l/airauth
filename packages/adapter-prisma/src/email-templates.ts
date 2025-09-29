/**
 * Basic email templates for AirAuth
 * These are functional templates for the free version
 * Premium templates with better design available in paid version
 */

export interface EmailTemplateParams {
  url: string;
  host: string;
  theme?: {
    colorScheme?: 'auto' | 'dark' | 'light';
    brandColor?: string;
  };
}

/**
 * Basic verification email template
 * Simple HTML with minimal styling
 */
export function verificationEmailTemplate({ url, host }: EmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const escapedHost = host.replace(/\./g, '&#8203;.');

  return {
    subject: `Sign in to ${host}`,
    text: `Sign in to ${host}\n\n${url}\n\nIf you did not request this email, you can safely ignore it.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${escapedHost}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9f9f9; border-radius: 5px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #333; margin-top: 0;">Sign in to ${escapedHost}</h2>
    <p style="margin: 15px 0;">Click the button below to sign in to your account:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: #0070f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign in</a>
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">Or copy and paste this URL into your browser:</p>
    <p style="color: #0070f3; word-break: break-all; font-size: 14px;">${url}</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin: 0;">If you did not request this email, you can safely ignore it.</p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Basic magic link email template
 */
export function magicLinkEmailTemplate({ url, host }: EmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const escapedHost = host.replace(/\./g, '&#8203;.');

  return {
    subject: `Your magic link for ${host}`,
    text: `Your magic link for ${host}\n\n${url}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this email, you can safely ignore it.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Link - ${escapedHost}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9f9f9; border-radius: 5px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #333; margin-top: 0;">🔮 Your Magic Link</h2>
    <p style="margin: 15px 0;">Click the button below to instantly sign in to ${escapedHost}:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: #5c2d91; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">✨ Sign in with Magic Link</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link will expire in <strong>10 minutes</strong>.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Basic password reset email template
 */
export function passwordResetEmailTemplate({ url, host }: EmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const escapedHost = host.replace(/\./g, '&#8203;.');

  return {
    subject: `Reset your password for ${host}`,
    text: `Reset your password for ${host}\n\n${url}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - ${escapedHost}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9f9f9; border-radius: 5px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #333; margin-top: 0;">🔐 Password Reset Request</h2>
    <p style="margin: 15px 0;">You requested to reset your password for ${escapedHost}.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Basic welcome email template
 */
export function welcomeEmailTemplate({ host }: { host: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const escapedHost = host.replace(/\./g, '&#8203;.');

  return {
    subject: `Welcome to ${host}!`,
    text: `Welcome to ${host}!\n\nYour account has been successfully created.\n\nThank you for joining us!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${escapedHost}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9f9f9; border-radius: 5px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #333; margin-top: 0;">🎉 Welcome to ${escapedHost}!</h2>
    <p style="margin: 15px 0;">Your account has been successfully created.</p>
    <p style="margin: 15px 0;">We're excited to have you on board!</p>
    <div style="background: #e5e7eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #555;">What's next?</h3>
      <ul style="color: #666;">
        <li>Complete your profile</li>
        <li>Explore our features</li>
        <li>Connect with others</li>
      </ul>
    </div>
    <p style="color: #666; font-size: 14px;">Thank you for joining us!</p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Basic account deleted email template
 */
export function accountDeletedEmailTemplate({ host }: { host: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const escapedHost = host.replace(/\./g, '&#8203;.');

  return {
    subject: `Your ${host} account has been deleted`,
    text: `Your account on ${host} has been successfully deleted.\n\nAll your data has been removed from our systems.\n\nWe're sorry to see you go.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted - ${escapedHost}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9f9f9; border-radius: 5px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #333; margin-top: 0;">Account Deleted</h2>
    <p style="margin: 15px 0;">Your account on ${escapedHost} has been successfully deleted.</p>
    <p style="margin: 15px 0;">All your data has been removed from our systems.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">We're sorry to see you go. If you change your mind, you're always welcome to create a new account.</p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Get email template by type
 */
export function getEmailTemplate(
  type: 'verification' | 'magic-link' | 'password-reset' | 'welcome' | 'account-deleted',
  params: EmailTemplateParams | { host: string }
) {
  switch (type) {
    case 'verification':
      return verificationEmailTemplate(params as EmailTemplateParams);
    case 'magic-link':
      return magicLinkEmailTemplate(params as EmailTemplateParams);
    case 'password-reset':
      return passwordResetEmailTemplate(params as EmailTemplateParams);
    case 'welcome':
      return welcomeEmailTemplate(params as { host: string });
    case 'account-deleted':
      return accountDeletedEmailTemplate(params as { host: string });
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}

// Note: Premium templates with better design, custom branding,
// responsive layouts, and dark mode support available in paid version
