/**
 * emailTemplates — branded HTML for transactional emails.
 *
 * BILINGUAL: every email renders an English block, a gold divider, then
 * an Arabic (RTL) block of the same content. The welcome email fires
 * from the Stripe webhook where we can't know the buyer's app language,
 * so showing both is the only reliable way to reach Arabic users.
 *
 * Design constraints unique to HTML email (versus a normal web page):
 *   - Outlook still uses Word's HTML renderer. <div> + flexbox doesn't
 *     work. Tables are the only reliable layout primitive.
 *   - Most clients strip <style> blocks. EVERY style must be inline.
 *   - Google Fonts work in Apple Mail + Gmail webmail but NOT in
 *     Outlook desktop. Always provide a serif/sans-serif fallback.
 *   - Arabic has no glyphs in Georgia/Times. Arabic text uses a
 *     Tahoma/Segoe UI/Arial stack, dir="rtl", right-aligned, and no
 *     letter-spacing / uppercase (both mangle Arabic).
 *   - background-image on <body> is blocked or stripped by most
 *     clients. Use solid colors inside nested tables instead.
 *   - Max safe width: 600px.
 *   - Big call-to-action buttons need MSO conditional comments to
 *     render as a proper button in Outlook (see buttonHtml()).
 *
 * Brand palette (mirrored from src/index.css):
 *   - Background: #0a0a0a (tinted near-black, not pure #000)
 *   - Card:       #0f0f0f
 *   - Primary gold: #e6c364   Gold light: #ffe08f   Gold deep: #c9a84c
 *   - Text on dark: #ffffff   Body: #c4c4c4   Muted: #7a7a7a
 */

const APP_ORIGIN = 'https://app.biozackteam.com';
const LOGO_URL = `${APP_ORIGIN}/icon-512.png?v=4`;
const TERMS_URL = `${APP_ORIGIN}/terms`;
const PRIVACY_URL = `${APP_ORIGIN}/privacy`;
const SUPPORT_EMAIL = 'support@biozackteam.com';

// Font stacks
const SERIF = `Georgia,'Times New Roman',serif`;          // EN headlines
const SANS = `Helvetica,Arial,sans-serif`;                 // EN body
const AR_FONT = `'Segoe UI',Tahoma,Arial,sans-serif`;      // Arabic (has glyphs)

// ─────────────────────────────────────────────────────────────────
//  Bulletproof button — renders properly in Outlook + everywhere.
//  lang='ar' switches to an Arabic-friendly font with no letter-
//  spacing / uppercase (both break Arabic shaping).
// ─────────────────────────────────────────────────────────────────
function buttonHtml(href: string, label: string, lang: 'en' | 'ar' = 'en'): string {
    const isAr = lang === 'ar';
    const font = isAr ? AR_FONT : `${SERIF}`;
    const spacing = isAr ? 'letter-spacing:0;' : 'letter-spacing:2px;text-transform:uppercase;';
    const msoFont = isAr ? AR_FONT : 'Georgia,serif';
    const msoSpacing = isAr ? '' : 'letter-spacing:2px;text-transform:uppercase;';
    return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:54px;v-text-anchor:middle;width:280px;" arcsize="50%" strokecolor="#c9a84c" fillcolor="#e6c364">
      <w:anchorlock/>
      <center style="color:#0a0a0a;font-family:${msoFont};font-size:14px;font-weight:bold;${msoSpacing}">${label}</center>
    </v:roundrect>
    <![endif]-->
    <![if !mso]>
      <a href="${href}" target="_blank" style="background:linear-gradient(135deg, #ffe08f, #e6c364 60%, #c9a84c);border-radius:32px;color:#0a0a0a;display:inline-block;font-family:${font};font-size:14px;font-weight:bold;${spacing}line-height:54px;text-align:center;text-decoration:none;width:280px;-webkit-text-size-adjust:none;mso-hide:all;">${label}</a>
    <![endif]>`;
}

// Centered short gold hairline — used as the EN | AR section divider.
function goldDivider(): string {
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td align="center" style="padding:30px 0 30px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="64">
          <tr><td style="border-top:1px solid rgba(230,195,100,0.40);font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
        </table>
      </td></tr>
    </table>`;
}

// Shared "button didn't work? copy this link" fallback (bilingual,
// shown once since the link is identical for both languages).
function fallbackLink(resetLink: string): string {
    return `
        <p style="margin:26px 0 6px 0;padding:0;font-family:${SANS};font-size:12px;color:#7a7a7a;line-height:1.6;text-align:center;">
            Button not working? Copy this link &middot; إن لم يعمل الزر، انسخ هذا الرابط:
        </p>
        <p style="margin:0;padding:0;font-family:'Courier New',monospace;font-size:11px;color:#a8a8a8;word-break:break-all;line-height:1.5;text-align:center;" dir="ltr">
            ${escapeHtml(resetLink)}
        </p>`;
}

// ─────────────────────────────────────────────────────────────────
//  Shared layout — branded shell (header logo + wordmark + gold
//  hairline, body, bilingual footer with legal links)
// ─────────────────────────────────────────────────────────────────
function layout(opts: { previewText: string; bodyHtml: string }): string {
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
    <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${opts.previewText}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#0f0f0f;border:1px solid rgba(230,195,100,0.18);border-radius:20px;">

            <!-- Header: logo + wordmark + full-width gold hairline -->
            <tr>
              <td align="center" style="padding:44px 32px 16px 32px;">
                <img src="${LOGO_URL}" width="84" height="84" alt="BioZackTeam" style="display:block;border:0;outline:none;text-decoration:none;width:84px;height:84px;border-radius:16px;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 26px 32px;">
                <div style="font-family:${SERIF};font-size:12px;font-weight:bold;color:#e6c364;letter-spacing:6px;text-transform:uppercase;">
                  BIOZACKTEAM
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;">
                <div style="height:1px;line-height:1px;font-size:0;background:linear-gradient(90deg, rgba(230,195,100,0) 0%, rgba(230,195,100,0.45) 50%, rgba(230,195,100,0) 100%);">&nbsp;</div>
              </td>
            </tr>

            <!-- Body content (caller-provided) -->
            <tr>
              <td style="padding:34px 44px 40px 44px;">
                ${opts.bodyHtml}
              </td>
            </tr>

            <!-- Footer: bilingual tagline + legal links -->
            <tr>
              <td style="padding:26px 40px 34px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="font-family:${SANS};font-size:11px;color:#7a7a7a;line-height:1.7;">
                      Human Optimization. Coded. &middot; تحسين الإنسان بأسلوب مدروس<br/>
                      BioZackTeam &middot; Casablanca, Morocco
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:14px;font-family:${SANS};font-size:11px;color:#7a7a7a;">
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
//  Bilingual plain-text alternative
// ─────────────────────────────────────────────────────────────────
function plainTextEmail(opts: {
    enGreeting: string; enBody: string; enCta: string;
    arGreeting: string; arBody: string; arCta: string;
    link: string;
}): string {
    return `${opts.enGreeting}

${opts.enBody}

${opts.enCta}: ${opts.link}

— — —

${opts.arGreeting}

${opts.arBody}

${opts.arCta}: ${opts.link}

(If the button doesn't work, paste the link into your browser. إن لم يعمل الزر، الصق الرابط في المتصفّح.)

—
BioZackTeam · Human Optimization. Coded.
Casablanca, Morocco

Terms: ${TERMS_URL}
Privacy: ${PRIVACY_URL}
Support: ${SUPPORT_EMAIL}
`;
}

// Renders one language block (headline + body paragraph + button).
// dir/align/fonts flip for Arabic.
function langBlock(opts: {
    lang: 'en' | 'ar';
    heading: string;
    body: string;
    ctaLabel: string;
    href: string;
    note?: string;       // small muted footnote under the button
}): string {
    const isAr = opts.lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const align = isAr ? 'right' : 'left';
    const headFont = isAr ? AR_FONT : SERIF;
    const bodyFont = isAr ? AR_FONT : SANS;
    const headSize = isAr ? '26px' : '30px';
    return `
        <div dir="${dir}" style="text-align:${align};">
            <h1 style="margin:0 0 16px 0;padding:0;font-family:${headFont};font-size:${headSize};font-weight:bold;color:#ffffff;line-height:1.2;letter-spacing:${isAr ? '0' : '-0.01em'};">
                ${opts.heading}
            </h1>
            <p style="margin:0 0 26px 0;padding:0;font-family:${bodyFont};font-size:15px;color:#c4c4c4;line-height:1.7;">
                ${opts.body}
            </p>
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
            <tr><td align="center">${buttonHtml(opts.href, opts.ctaLabel, opts.lang)}</td></tr>
        </table>
        ${opts.note ? `
        <p dir="${dir}" style="margin:18px 0 0 0;padding:0;font-family:${bodyFont};font-size:11px;color:#6a6a6a;line-height:1.6;text-align:${align};">
            ${opts.note}
        </p>` : ''}`;
}

// ─────────────────────────────────────────────────────────────────
//  Welcome email — sent after Stripe payment when we've just
//  created the user's Auth account. Contains the password-set link.
// ─────────────────────────────────────────────────────────────────
export function welcomeEmail(resetLink: string, displayName?: string): { subject: string; html: string; text: string } {
    const firstName = (displayName ?? '').split(' ')[0]?.trim();
    const safeName = firstName ? escapeHtml(firstName) : '';
    const subject = `Welcome to BioZackTeam · مرحبًا بك`;
    const previewText = 'Your account is ready — set your password. حسابك جاهز، عيّن كلمة المرور.';

    const enHeading = safeName ? `Welcome, ${safeName}.` : `Welcome to BioZackTeam.`;
    const arHeading = safeName ? `مرحبًا، ${safeName}.` : `مرحبًا بك في بايوزاك تيم.`;
    const enBody = `Your payment came through and your account is ready. Tap below to set your password, then sign in and meet your coach.`;
    const arBody = `تم استلام دفعتك وحسابك جاهز. اضغط الزر أدناه لتعيين كلمة المرور، ثم سجّل الدخول وتعرّف على مدرّبك.`;

    const bodyHtml = `
        ${langBlock({
            lang: 'en', heading: enHeading, body: enBody,
            ctaLabel: 'Set my password', href: resetLink,
            note: `Didn't sign up? You can ignore this email — the link expires in 24 hours.`,
        })}
        ${goldDivider()}
        ${langBlock({
            lang: 'ar', heading: arHeading, body: arBody,
            ctaLabel: 'تعيين كلمة المرور', href: resetLink,
            note: `لم تقم بالتسجيل؟ يمكنك تجاهل هذا البريد — تنتهي صلاحية الرابط خلال 24 ساعة.`,
        })}
        ${fallbackLink(resetLink)}
    `;

    return {
        subject,
        html: layout({ previewText, bodyHtml }),
        text: plainTextEmail({
            enGreeting: enHeading,
            enBody: `Your payment came through and your account is ready. Set your password to get started.`,
            enCta: 'Set my password',
            arGreeting: arHeading,
            arBody: `تم استلام دفعتك وحسابك جاهز. عيّن كلمة المرور للبدء.`,
            arCta: 'تعيين كلمة المرور',
            link: resetLink,
        }),
    };
}

// ─────────────────────────────────────────────────────────────────
//  Password reset email — sent when an existing user taps "Forgot
//  password" on the Login page.
// ─────────────────────────────────────────────────────────────────
export function passwordResetEmail(resetLink: string): { subject: string; html: string; text: string } {
    const subject = `Reset your password · إعادة تعيين كلمة المرور`;
    const previewText = 'Choose a new password. اختر كلمة مرور جديدة.';

    const enBody = `You asked to reset your BioZackTeam password. Tap below to choose a new one.`;
    const arBody = `لقد طلبت إعادة تعيين كلمة مرور حسابك في بايوزاك تيم. اضغط الزر أدناه لاختيار كلمة مرور جديدة.`;

    const bodyHtml = `
        ${langBlock({
            lang: 'en', heading: 'Reset your password', body: enBody,
            ctaLabel: 'Reset password', href: resetLink,
            note: `Didn't request this? Ignore this email — your password won't change. The link expires in 1 hour.`,
        })}
        ${goldDivider()}
        ${langBlock({
            lang: 'ar', heading: 'إعادة تعيين كلمة المرور', body: arBody,
            ctaLabel: 'إعادة تعيين كلمة المرور', href: resetLink,
            note: `لم تطلب ذلك؟ تجاهل هذا البريد — لن تتغيّر كلمة مرورك. تنتهي صلاحية الرابط خلال ساعة.`,
        })}
        ${fallbackLink(resetLink)}
    `;

    return {
        subject,
        html: layout({ previewText, bodyHtml }),
        text: plainTextEmail({
            enGreeting: 'Reset your password',
            enBody,
            enCta: 'Reset password',
            arGreeting: 'إعادة تعيين كلمة المرور',
            arBody,
            arCta: 'إعادة تعيين كلمة المرور',
            link: resetLink,
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
