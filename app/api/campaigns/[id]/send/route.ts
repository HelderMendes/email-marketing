import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Initial implementation: Send immediately (not scalable for thousands, but good for MVP)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const campaign = await prisma.campaign.findUnique({
            where: { id: parseInt(id) },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 },
            );
        }

        if (campaign.status === 'SENT') {
            return NextResponse.json(
                { error: 'Campaign already sent' },
                { status: 400 },
            );
        }

        const contacts = await prisma.contact.findMany({
            where: { status: 'SUBSCRIBED' },
        });

        // Loop and "send"
        // In production, push to queue.
        console.log(
            `Starting send for campaign ${campaign.name} to ${contacts.length} contacts`,
        );

        const updates = contacts.map(async (contact) => {
            // Replace tokens
            let html = campaign.htmlContent || '';
            const unsubscribeUrl = `https://look-out.nl/unsubscribe/${contact.unsubscribeToken}`;
            const viewUrl = `https://look-out.nl/campaigns/${campaign.id}/webview`;
            // Or local env URL

            html = html
                .replace('{{firstName}}', contact.firstName || '')
                .replace('{{unsubscribeUrl}}', unsubscribeUrl)
                .replace('{{viewUrl}}', viewUrl);

            // Mock Send
            console.log(
                `[MOCK SEND] To: ${contact.email}, Subject: ${campaign.subject}`,
            );

            // Create record
            await prisma.campaignEmail.create({
                data: {
                    campaignId: campaign.id,
                    contactId: contact.id,
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });
        });

        await Promise.all(updates);

        // Update campaign status
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            count: contacts.length,
        });
    } catch (error) {
        console.error('Send error:', error);
        return NextResponse.json(
            { error: 'Failed to send campaign' },
            { status: 500 },
        );
    }
}
