// Email renderer that wraps content with the user's theme settings
export interface EmailTheme {
    backgroundColor: string;
    textColor: string;
    linkColor: string;
    headerBg: string;
    headerText: string;
    headerContent: string;
    footerBg: string;
    footerText: string;
    footerLinkColor: string;
    emailHeaderBg: string;
    emailHeaderContent: string;
    preFooterBg: string;
    preFooterContent: string;
    // Instagram button styling
    instagramButtonBg: string;
    instagramButtonText: string;
    instagramButtonBorder: string;
    instagramButtonRadius: number;
    // Content area styling
    contentBg: string;
    contentPaddingX: number;
    contentPaddingY: number;
    contentMaxWidth: number;
    // Social media
    socialFacebook?: string;
    socialTwitter?: string;
    socialInstagram?: string;
    socialLinkedin?: string;
    // Social icon styling
    socialIconBg: string;
    socialIconColor: string;
    // Footer content
    footerAddress?: string;
    footerExplanation?: string;
    footerLogo?: 'white' | 'black';
    footerCopyrightColor?: string;
}

export const defaultTheme: EmailTheme = {
    backgroundColor: '#f6f9fc',
    textColor: '#333333',
    linkColor: '#0070f3',
    headerBg: '#ffffff',
    headerText: '#111111',
    headerContent: 'LOOKOUT MODE EXTRA',
    footerBg: '#2a2a2a',
    footerText: '#ffffff',
    footerLinkColor: '#c896aa',
    emailHeaderBg: '#eef2f5',
    emailHeaderContent: '',
    preFooterBg: '#f0f0f0',
    preFooterContent: '',
    instagramButtonBg: '#d4a5b9',
    instagramButtonText: '#ffffff',
    instagramButtonBorder: '#d4a5b9',
    instagramButtonRadius: 50,
    contentBg: 'transparent',
    contentPaddingX: 0,
    contentPaddingY: 0,
    contentMaxWidth: 600,
    socialIconBg: '#333333',
    socialIconColor: '#ffffff',
    footerAddress: 'Huizerweg 45 – 1401 GH, Bussum',
    footerExplanation:
        'U ontvangt deze nieuwsbrief van LOOK OUT MODE omdat u ons daar toestemming voor heeft gegeven. Zo nu en dan sturen wij u een mailtje over geplande uitverkopen, nieuwe collecties en andere belangrijke dingen. Wij zullen het kort en informatief houden. Beloofd!',
    footerLogo: 'white',
    footerCopyrightColor: 'rgba(0,0,0,0.6)',
};

export function renderEmailHtml(
    content: string,
    theme: EmailTheme = defaultTheme,
    options?: { viewInBrowserUrl?: string; campaignId?: number },
) {
    const viewInBrowserUrl =
        options?.viewInBrowserUrl ||
        (options?.campaignId
            ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/c/${options.campaignId}`
            : '');
    const {
        backgroundColor,
        textColor,
        linkColor,
        footerBg,
        footerText,
        footerLinkColor,
        emailHeaderBg,
        emailHeaderContent,
        preFooterBg,
        instagramButtonBg,
        instagramButtonText,
        instagramButtonBorder,
        instagramButtonRadius,
        contentBg: rawContentBg,
        contentPaddingX,
        contentPaddingY,
        contentMaxWidth,
        footerAddress,
        footerExplanation,
        footerLogo,
        footerCopyrightColor,
    } = { ...defaultTheme, ...theme };

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://email-marketing-blush.vercel.app';

    const logoFile =
        footerLogo === 'black'
            ? 'logo_LookoutMode_black.png'
            : 'logo_LookoutMode.webp';

    // Use outer background color if content bg is transparent
    const contentBg =
        rawContentBg === 'transparent' ? backgroundColor : rawContentBg;

    // HTML structure
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      margin: 0; padding: 0; 
    }
    p { margin-bottom: 1em; }
    a { color: ${linkColor}; text-decoration: none; }
    img { max-width: 100%; height: auto; }
    .btn { 
      display: inline-block; 
      padding: 10px 20px; 
      background-color: ${linkColor}; 
      color: white !important; 
      border-radius: 4px; 
      text-decoration: none; 
    }

    /* Optimized hover for email header */
    .hover-header {
      color: white !important;
      font-size: 20px !important;
      max-width: ${contentMaxWidth}px !important;
      text-decoration: none !important;
      transition: color 0.2s ease-in-out !important;
      display: inline-block !important;
      margin-bottom: -15px !important;
    }

    .hover-header:hover {
      color: ${textColor} !important;
      text-decoration: underline !important;
    }

    /* Optional: hover for the "view in browser" link */
    .view-in-browser {
      color: white !important;
      font-size: 12px !important;
      text-decoration: underline !important;
      opacity: 0.7 !important;
      transition: color 0.2s ease-in-out !important;
    }

    .view-in-browser:hover {
      color: ${textColor} !important;
      opacity: 1 !important;
    }
  </style>
</head>

<body style="background-color: ${backgroundColor}; color: ${textColor}; padding: 0; margin: 0;">
  
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    
<!-- VIEW IN BROWSER -->
    ${
        viewInBrowserUrl
            ? `
    <tr>
      <td align="center" style="background-color: ${backgroundColor}; padding: 10px 10px 0 10px;">
        <a href="${viewInBrowserUrl}" 
           target="_blank" 
           class="view-in-browser"
           style="color: white; font-size: 20px !important; text-decoration: none !important; ">
          Bekijk deze email in je browser
        </a>
      </td>
    </tr>
    `
            : ''
    }

    <!-- EMAIL HEADER -->
    ${
        emailHeaderContent
            ? `
    <tr>
      <td align="center" style="background-color: ${emailHeaderBg}; padding: 20px 20px;">
        <div class="hover-header" style="color: white; font-size: 14px; max-width: ${contentMaxWidth}px;">
          ${emailHeaderContent}
        </div>
      </td>
    </tr>
    `
            : ''
    }

    <!-- MAIN BODY -->
    <tr>
      <td align="center" style="background-color: ${contentBg}; padding: 0px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: ${contentMaxWidth}px; background-color: ${contentBg}; border-radius: 0px; overflow: hidden; box-shadow: none;">
          <tr>
            <td style="padding: ${contentPaddingY}px ${contentPaddingX}px; font-size: 20px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PRE-FOOTER / INSTAGRAM BUTTON -->
    <tr>
      <td align="center" style="background-color: ${preFooterBg}; padding: 30px 0px;">
        <a href="https://www.instagram.com/lookoutmode/" target="_blank" style="display: inline-block; padding: 10px 60px; background-color: ${instagramButtonBg}; color: ${instagramButtonText}; font-size: 18px; font-weight: 500; text-decoration: none; border-radius: ${instagramButtonRadius}px; border: 2px solid ${instagramButtonBorder}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          Volg lookoutmode op instagram
        </a>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" style="background-color: ${footerBg}; color: ${footerText}; padding: 0 20px 20px; font-size: 13px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <div style="margin: 0 auto;">
          <a href="https://lookoutmode.nl/" target="_blank" style="text-decoration: none;">
            <img src="${appUrl}/${logoFile}" alt="LOOK OUT mode" width="370" style="display: block; margin: 0 auto; max-width: 100%; height: auto; border: none;" />
          </a>
        </div>
        
        <p style="margin: 0 0 15px; font-size: 26px;">${footerAddress || ''}</p>
        
        ${
            footerExplanation
                ? `<p style="margin: 0 auto; padding-bottom: 15px; text-align: center; max-width: 500px; color: ${footerText}; font-size: 15px; line-height: 1.6;">
          ${footerExplanation}
        </p>`
                : ''
        }
        
        <p style="margin: 0; padding-bottom: 8px; font-size: 15px; line-height: 1.6;">
          You can <a href="{{preferencesUrl}}" style="color: ${footerLinkColor}; text-decoration: underline;">update your preferences</a> or <a href="{{unsubscribeUrl}}" style="color: ${footerLinkColor}; text-decoration: underline;">unsubscribe</a> from this list.
        </p>

        <p style="margin: 0; padding-bottom: 2px; font-size: 15px; line-height: 1.6;">
          <a href="{{shareUrl}}" style="color: ${footerLinkColor}; text-decoration: underline;">Share the email campaigne with a friend</a>
        </p>
      </td>
          <tr>
      <td align="center" style="background-color: ${footerBg}; color: ${footerText}; padding: 0 20px 20px; font-size: 13px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <p style="margin: 0; font-size: 13px; color: ${footerCopyrightColor || 'rgba(0,0,0,0.6)'};">Copyright &copy; ${new Date().getFullYear()} Look Out Mode, All rights reserved.</p>

    </tr>

  </table>

</body>
</html>
  `;
}
