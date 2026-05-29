/**
 * emailTemplates — branded HTML for transactional emails.
 *
 * Design constraints unique to HTML email (versus a normal web page):
 *   - Outlook still uses Word's HTML renderer. <div> + flexbox doesn't
 *     work. Tables are the only reliable layout primitive.
 *   - Most clients strip <style> blocks. EVERY style must be inline.
 *   - Google Fonts work in Apple Mail + Gmail webmail but NOT in
 *     Outlook desktop. Always provide a serif/sans-serif fallback
 *     in the same font-family string.
 *   - background-image on <body> is blocked or stripped by most
 *     clients. Use solid colors inside nested tables instead.
 *   - Max safe width: 600px. Wider gets clipped on phones AND
 *     desktop Outlook.
 *   - Big call-to-action buttons need MSO conditional comments to
 *     render as a proper button in Outlook (otherwise they render
 *     as plain text). The `buttonHtml()` helper below handles that.
 *
 * Brand palette (mirrored from src/index.css):
 *   - Background: #0a0a0a (tinted near-black, not pure #000)
 *   - Primary gold: #e6c364
 *   - Gold light:   #ffe08f
 *   - Text on dark: #f3f4f6
 *   - Muted body:   rgba(255,255,255,0.65) → flattened to #a8a8a8 for email
 */

const APP_ORIGIN = 'https://app.biozackteam.com';
const LOGO_URL = `${APP_ORIGIN}/icon-512.png?v=4`;
const TERMS_URL = `${APP_ORIGIN}/terms`;
const PRIVACY_URL = `${APP_ORIGIN}/privacy`;
const SUPPORT_EMAIL = 'support@biozackteam.com';

// ─────────────────────────────────────────────────────────────────
//  Bulletproof button — renders properly in Outlook + everywhere
// ─────────────────────────────────────────────────────────────────
function buttonHtml(href: string, label: string): string {
    return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:54px;v-text-anchor:middle;width:280px;" arcsize="50%" strokecolor="#c9a84c" fillcolor="#e6c364">
      <w:anchorlock/>
      <center style="color:#0a0a0a;font-family:Georgia,serif;font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${label}</center>
    </v:roundrect>
    <![endif]-->
    <![if !mso]>
      <a href="${href}" target="_blank" style="background:linear-gradient(135deg, #ffe08f, #e6c364 60%, #c9a84c);border-radius:32px;color:#0a0a0a;display:inline-block;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:bold;letter-spacing:2px;line-height:54px;text-align:center;text-decoration:none;text-transform:uppercase;width:280px;-webkit-text-size-adjust:none;mso-hide:all;">${label}</a>
    <![endif]>`;
}

// ─────────────────────────────────────────────────────────────────
//  Shared layout — wraps every email's body content in the
//  branded shell (header, logo, footer with legal links)
// ─────────────────────────────────────────────────────────────────
function layout(opts: {
    previewText: string;     // shows after the subject in inbox preview
    bodyHtml: string;        // already-rendered inner content
}): string {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="format-detection" content="telephone=no" />
    <title>BioZackTeam</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0a0a;-webkit-text-size-adjust:none;">
    <!-- Inbox preview text. Hidden in the body via the 0-height
         span trick so it shows in the preview line only. -->
    <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${opts.previewText}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#0f0f0f;border:1px solid rgba(230,195,100,0.15);border-radius:18px;">

            <!-- Header: logo + thin gold accent line -->
            <tr>
              <td align="center" style="padding:36px 32px 20px 32px;">
                <img src="${LOGO_URL}" width="72" height="72" alt="BioZackTeam" style="display:block;border:0;outline:none;text-decoration:none;width:72px;height:72px;border-radius:14px;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 8px 32px;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;font-weight:bold;color:#e6c364;letter-spacing:4px;text-transform:uppercase;">
                  BIOZACKTEAM
                </div>
              </td>
            </tr>

            <!-- Body content (caller-provided) -->
            <tr>
              <td style="padding:24px 40px 36px 40px;">
                ${opts.bodyHtml}
              </td>
            </tr>

            <!-- Footer: legal links + Casablanca address -->
            <tr>
              <td style="padding:24px 40px 32px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#7a7a7a;line-height:1.6;">
                      Human Optimization. Coded.<br/>
                      BioZackTeam &middot; Casablanca, Morocco
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#7a7a7a;">
                      <a href="${TERMS_URL}" style="color:#a8a8a8;text-decoration:none;">Terms</a>
                      &nbsp;&middot;&nbsp;
                      <a href="${PRIVACY_URL}" style="color:#a8a8a8;text-decoration:none;">Privacy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="mailto:${SUPPORT_EMAIL}" style="color:#a8a8a8;text-decoration:none;">Support</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────
//  Plain-text alternative — generated alongside every HTML email
//  for clients that block HTML or for spam-filter scoring.
// ─────────────────────────────────────────────────────────────────
function plainTextEmail(opts: { greeting: string; body: string; link: string; cta: string }): string {
    return `${opts.greeting}

${opts.body}

${opts.cta}: ${opts.link}

(If the button above doesn't work, copy and paste this link into your browser.)

—
BioZackTeam · Human Optimization. Coded.
Casablanca, Morocco

Terms: ${TERMS_URL}
Privacy: ${PRIVACY_URL}
Support: ${SUPPORT_EMAIL}
`;
}

// ─────────────────────────────────────────────────────────────────
//  Welcome email — sent after Stripe payment when we've just
//  created the user's Auth account. Contains the password-set link.
// ─────────────────────────────────────────────────────────────────
export function welcomeEmail(resetLink: string, displayName?: string): { subject: string; html: string; text: string } {
    const firstName = (displayName ?? '').split(' ')[0]?.trim();
    const greeting = firstName ? `Welcome, ${escapeHtml(firstName)}.` : `Welcome to BioZackTeam.`;
    const subject = `Welcome to BioZackTeam — set your password`;
    const previewText = 'Your account is ready. Set your password to get started.';

    const bodyHtml = `
        <h1 style="margin:0 0 16px 0;padding:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:bold;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
            ${greeting}
        </h1>
        <p style="margin:0 0 24px 0;padding:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#c4c4c4;line-height:1.65;">
            Your payment came through and your account is ready. Tap the button below to set your password — then sign in and meet your coach.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 24px auto;">
            <tr><td align="center">${buttonHtml(resetLink, 'Set my password')}</td></tr>
        </table>

        <p style="margin:24px 0 8px 0;padding:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#7a7a7a;line-height:1.6;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px 0;padding:0;font-family:'Courier New',monospace;font-size:11px;color:#a8a8a8;word-break:break-all;line-height:1.5;">
            ${escapeHtml(resetLink)}
        </p>

        <p style="margin:24px 0 0 0;padding:16px 18px;background-color:rgba(230,195,100,0.06);border-left:3px solid #e6c364;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#c4c4c4;line-height:1.55;">
            <strong style="color:#e6c364;font-family:Georgia,serif;">What's next:</strong> after you set your password and sign in, you'll see your training plan, weekly check-in, and the Academy. Your coach reviews check-ins weekly.
        </p>

        <p style="margin:20px 0 0 0;padding:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#6a6a6a;line-height:1.5;">
            Didn't sign up? You can safely ignore this email; the link will expire in 24 hours.
        </p>
    `;

    return {
        subject,
        html: layout({ previewText, bodyHtml }),
        text: plainTextEmail({
            greeting,
            body: `Your payment came through and your account is ready. Set your password to get started.`,
            link: resetLink,
            cta: 'Set my password',
        }),
    };
}

// ─────────────────────────────────────────────────────────────────
//  Password reset email — sent when an existing user taps "Forgot
//  password" on the Login page.
// ─────────────────────────────────────────────────────────────────
export function passwordResetEmail(resetLink: string): { subject: string; html: string; text: string } {
    const subject = `Reset your BioZackTeam password`;
    const previewText = 'Tap the button to choose a new password.';

    const bodyHtml = `
        <h1 style="margin:0 0 16px 0;padding:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
            Reset your password
        </h1>
        <p style="margin:0 0 24px 0;padding:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#c4c4c4;line-height:1.65;">
            You asked to reset your BioZackTeam password. Tap the button below to choose a new one.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 24px auto;">
            <tr><td align="center">${buttonHtml(resetLink, 'Reset password')}</td></tr>
        </table>

        <p style="margin:24px 0 8px 0;padding:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#7a7a7a;line-height:1.6;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px 0;padding:0;font-family:'Courier New',monospace;font-size:11px;color:#a8a8a8;word-break:break-all;line-height:1.5;">
            ${escapeHtml(resetLink)}
        </p>

        <p style="margin:24px 0 0 0;padding:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#6a6a6a;line-height:1.5;">
            Didn't request this? You can safely ignore this email. Your password won't change unless you tap the link above. The link expires in 1 hour.
        </p>
    `;

    return {
        subject,
        html: layout({ previewText, bodyHtml }),
        text: plainTextEmail({
            greeting: 'Reset your password',
            body: `You asked to reset your BioZackTeam password. Tap the link below to choose a new one.`,
            link: resetLink,
            cta: 'Reset password',
        }),
    };
}

// Minimal HTML escaper for any user-controlled value we drop into
// the template (display name, the URL itself). Stops a malicious
// name like <script> from injecting markup into the email body.
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
