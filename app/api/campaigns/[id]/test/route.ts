import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderEmailHtml, EmailTheme } from '@/lib/email-renderer';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Valid email address is required' },
                { status: 400 },
            );
        }

        // Support multiple comma-separated emails
        const emailAddresses = email
            .split(',')
            .map((e) => e.trim())
            .filter((e) => e.length > 0);

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

        const emailHtml = renderedHtml
            .replace(/{{firstName}}/g, contact?.firstName || 'Test User')
            .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
            .replace(/{{preferencesUrl}}/g, preferencesUrl)
            .replace(/{{viewUrl}}/g, viewUrl)
            .replace(
                /{{shareUrl}}/g,
                `mailto:?subject=Look Out Mode Newsletter&body=Check out our latest news: ${viewUrl}`,
            );

        console.log(
            `[REAL TEST SEND] To: ${emailAddresses.join(', ')}, Subject: [TEST] ${campaign.subject}`,
        );

        const result = await resend.emails.send({
            from:
                process.env.RESEND_FROM_EMAIL ||
                'Lookout Mode <hello@helderdesign.nl>',
            to: emailAddresses,
            subject: `[TEST] ${campaign.subject || 'No Subject'}`,
            html: emailHtml,
        });

        if (result.error) {
            console.error('Resend API Error:', result.error);
            return NextResponse.json(
                { error: result.error.message },
                { status: 400 },
            );
        }

        return NextResponse.json({
            success: true,
            email: emailAddresses.join(', '),
            id: result.data?.id,
        });
    } catch (error) {
        console.error('Test Send error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred during test send' },
            { status: 500 },
        );
    }
}
