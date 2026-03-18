// Email renderer that wraps content with the user's theme settings
export interface EmailTheme {
    backgroundColor: string;
    textColor: string;
    linkColor: string;
    headerBg: string;
    headerText: string;
    footerBg: string;
    footerText: string;
    preBodyBg: string; // The section before the main body
    preFooterBg: string; // The section before the footer
    socialFacebook?: string;
    socialTwitter?: string;
    socialInstagram?: string;
    socialLinkedin?: string;
}

export const defaultTheme: EmailTheme = {
    backgroundColor: '#f6f9fc',
    textColor: '#333333',
    linkColor: '#0070f3',
    headerBg: '#ffffff',
    headerText: '#111111',
    footerBg: '#2a2a2a',
    footerText: '#ffffff',
    preBodyBg: '#eef2f5',
    preFooterBg: '#f0f0f0',
};

export function renderEmailHtml(
    content: string,
    theme: EmailTheme = defaultTheme,
) {
    const {
        backgroundColor,
        textColor,
        linkColor,
        headerBg,
        headerText,
        footerBg,
        footerText,
        preBodyBg,
        preFooterBg,
        socialFacebook,
        socialTwitter,
        socialInstagram,
        socialLinkedin,
    } = { ...defaultTheme, ...theme };

    // Simple HTML structure with inline styles for email compatibility
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
    p { margin-bottom: 1em; }
    a { color: ${linkColor}; text-decoration: none; }
    img { max-width: 100%; height: auto; }
    .btn { display: inline-block; padding: 10px 20px; background-color: ${linkColor}; color: white !important; border-radius: 4px; text-decoration: none; }
  </style>
</head>
<body style="background-color: ${backgroundColor}; color: ${textColor}; padding: 0; margin: 0;">
  
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    
    <!-- HEADER -->
    <tr>
      <td align="center" style="background-color: ${headerBg}; padding: 20px;">
        <h1 style="color: ${headerText}; margin: 0; font-size: 24px;">LOOKOUT MODE</h1>
      </td>
    </tr>

    <!-- PRE-BODY -->
    <tr>
      <td align="center" style="background-color: ${preBodyBg}; padding: 10px;">
        <!-- Optional Pre-body content -->
      </td>
    </tr>

    <!-- MAIN BODY -->
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px; font-size: 16px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PRE-FOOTER -->
    <tr>
      <td align="center" style="background-color: ${preFooterBg}; padding: 30px;">
        <div>
          ${socialFacebook ? `<a href="${socialFacebook}" style="margin: 0 10px;">Facebook</a>` : ''}
          ${socialTwitter ? `<a href="${socialTwitter}" style="margin: 0 10px;">Twitter</a>` : ''}
          ${socialInstagram ? `<a href="${socialInstagram}" style="margin: 0 10px;">Instagram</a>` : ''}
          ${socialLinkedin ? `<a href="${socialLinkedin}" style="margin: 0 10px;">LinkedIn</a>` : ''}
        </div>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" style="background-color: ${footerBg}; color: ${footerText}; padding: 40px 20px; font-size: 14px;">
        <p style="margin: 0 0 10px;">&copy; ${new Date().getFullYear()} Lookout Mode. All rights reserved.</p>
        <p style="margin: 0;">
          <a href="{{unsubscribe_url}}" style="color: ${footerText}; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;
}
