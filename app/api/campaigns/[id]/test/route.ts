import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { renderEmailHtml, EmailTheme } from '@/lib/email-renderer';

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Send email using Resend API
 */
async function sendWithResend(options: {
    to: string;
    toName?: string;
    subject: string;
    html: string;
}) {
    const fromEmail = process.env.SENDER_FROM_EMAIL || 'info@lookoutmode.nl';
    const fromName = process.env.SENDER_FROM_NAME || 'Look Out Mode';

    const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [options.to],
            subject: options.subject,
            html: options.html,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message || `Resend API error: ${response.status}`,
        );
    }

    return response.json();
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email, instructions } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Valid email address is required' },
                { status: 400 },
            );
        }

        // Support multiple emails separated by comma or semicolon
        const emailAddresses = email
            .split(/[,;]/)
            .map((e: string) => e.trim())
            .filter((e: string) => e.length > 0);

        const campaign = await prisma.campaign.findUnique({
            where: { id: parseInt(id) },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 },
            );
        }

        // Check if first test email recipient is an existing contact
        const contact = await prisma.contact.findFirst({
            where: { email: emailAddresses[0].toLowerCase() },
        });

        // Render full HTML document
        const renderedHtml = renderEmailHtml(
            campaign.htmlContent || '',
            (campaign.theme as unknown as EmailTheme) || undefined,
            { campaignId: campaign.id },
        );

        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || 'https://lookoutmode.nl';
        const viewUrl = `${baseUrl}/campaigns/${campaign.id}/webview`;

        // Use real URLs if contact exists, otherwise placeholder
        const unsubscribeUrl = contact
            ? `${baseUrl}/unsubscribe/${contact.unsubscribeToken}`
            : '#';
        const preferencesUrl = contact
            ? `${baseUrl}/preferences/${contact.unsubscribeToken}`
            : '#';

        // Build instructions banner if provided
        const instructionsBanner =
            instructions && instructions.trim()
                ? `<div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px auto; max-width: 580px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">📋 Test Instructions:</div>
                <div style="color: #78350f; white-space: pre-wrap;">${instructions.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </div>`
                : '';

        let emailHtml = renderedHtml
            .replace(/{{firstName}}/g, contact?.firstName || 'Test User')
            .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
            .replace(/{{preferencesUrl}}/g, preferencesUrl)
            .replace(/{{viewUrl}}/g, viewUrl)
            .replace(
                /{{shareUrl}}/g,
                `mailto:?subject=Look Out Mode Newsletter&body=Check out our latest news: ${viewUrl}`,
            );

        // Insert instructions banner after <body> tag
        if (instructionsBanner) {
            emailHtml = emailHtml.replace(
                /<body([^>]*)>/i,
                `<body$1>${instructionsBanner}`,
            );
        }

        console.log(
            `[TEST SEND] To: ${emailAddresses.join(', ')}, Subject: [TEST] ${campaign.subject}`,
        );

        // Send to each email address (Sender.net API sends to one recipient at a time)
        const results = [];
        for (const addr of emailAddresses) {
            try {
                const result = await sendWithResend({
                    to: addr,
                    subject: `[TEST] ${campaign.subject || 'No Subject'}`,
                    html: emailHtml,
                });
                results.push({ email: addr, success: true, id: result.id });
            } catch (err) {
                console.error(`Failed to send to ${addr}:`, err);
                results.push({
                    email: addr,
                    success: false,
                    error: String(err),
                });
            }
        }

        const allSuccess = results.every((r) => r.success);
        if (!allSuccess) {
            const failed = results.filter((r) => !r.success);
            return NextResponse.json(
                {
                    error: `Failed to send to: ${failed.map((f) => f.email).join(', ')}`,
                },
                { status: 400 },
            );
        }

        return NextResponse.json({
            success: true,
            email: emailAddresses.join(', '),
            results,
        });
    } catch (error) {
        console.error('Test Send error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred during test send' },
            { status: 500 },
        );
    }
}
