import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import {
    renderEmailHtml,
    wrapLinksWithTracking,
    type EmailTheme,
} from '@/lib/email-renderer';
import { randomUUID } from 'crypto';

const RESEND_API_URL = 'https://api.resend.com/emails';
const BATCH_SIZE = 50;

/**
 * Send email using Resend API
 */
async function sendWithResend(options: {
    to: string;
    toName?: string;
    subject: string;
    html: string;
    listUnsubscribe?: string;
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
            headers: options.listUnsubscribe
                ? { 'List-Unsubscribe': `<${options.listUnsubscribe}>` }
                : undefined,
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

/**
 * Process a batch of emails for a campaign
 */
async function processCampaignBatch(
    campaign: {
        id: number;
        name: string;
        subject: string | null;
        htmlContent: string | null;
        theme: unknown;
    },
    groupIds: number[] | null,
): Promise<{ sentCount: number; failedCount: number; isComplete: boolean }> {
    // Get contacts that haven't been emailed yet
    const alreadySentContactIds = await prisma.campaignEmail.findMany({
        where: { campaignId: campaign.id },
        select: { contactId: true },
    });

    const sentIds = alreadySentContactIds.map((e) => e.contactId);

    const contactWhere: {
        status: string;
        id: { notIn: number[] };
        groups?: { some: { id: { in: number[] } } };
    } = {
        status: 'SUBSCRIBED',
        id: { notIn: sentIds.length > 0 ? sentIds : [-1] },
    };

    if (groupIds && groupIds.length > 0) {
        contactWhere.groups = { some: { id: { in: groupIds } } };
    }

    const contactsToSend = await prisma.contact.findMany({
        where: contactWhere,
        take: BATCH_SIZE,
    });

    if (contactsToSend.length === 0) {
        return { sentCount: 0, failedCount: 0, isComplete: true };
    }

    let batchSentCount = 0;
    let batchFailedCount = 0;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lookoutmode.nl';

    for (const contact of contactsToSend) {
        const trackingId = randomUUID();
        const unsubscribeUrl = `${appUrl}/unsubscribe/${contact.unsubscribeToken}`;
        const preferencesUrl = `${appUrl}/preferences/${contact.unsubscribeToken}`;
        const viewUrl = `${appUrl}/campaigns/${campaign.id}/webview`;

        const renderedHtml = renderEmailHtml(
            campaign.htmlContent || '',
            (campaign.theme as EmailTheme) || undefined,
            { campaignId: campaign.id, trackingId, appUrl },
        );

        let emailHtml = renderedHtml
            .replace(/{{firstName}}/g, contact.firstName || '')
            .replace(/{{lastName}}/g, contact.lastName || '')
            .replace(/{{email}}/g, contact.email)
            .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
            .replace(/{{preferencesUrl}}/g, preferencesUrl)
            .replace(/{{viewUrl}}/g, viewUrl)
            .replace(
                /{{shareUrl}}/g,
                `mailto:?subject=Look Out Mode Newsletter&body=Check out our latest news: ${viewUrl}`,
            );

        emailHtml = wrapLinksWithTracking(emailHtml, trackingId, appUrl);

        let sendSuccess = false;

        try {
            await sendWithResend({
                to: contact.email,
                toName:
                    `${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
                    undefined,
                subject: campaign.subject || 'No Subject',
                html: emailHtml,
                listUnsubscribe: unsubscribeUrl,
            });

            sendSuccess = true;
            batchSentCount++;
        } catch (err) {
            console.error(`[CRON] Error sending to ${contact.email}:`, err);
            batchFailedCount++;
        }

        await prisma.campaignEmail.create({
            data: {
                campaignId: campaign.id,
                contactId: contact.id,
                trackingId,
                status: sendSuccess ? 'SENT' : 'FAILED',
                sentAt: new Date(),
            },
        });
    }

    // Check if there are more contacts to send
    const remainingContacts = await prisma.contact.count({
        where: {
            ...contactWhere,
            id: {
                notIn: [...sentIds, ...contactsToSend.map((c) => c.id)],
            },
        },
    });

    return {
        sentCount: batchSentCount,
        failedCount: batchFailedCount,
        isComplete: remainingContacts === 0,
    };
}

/**
 * GET /api/cron/process-scheduled
 *
 * Cron endpoint to process scheduled campaigns.
 * Called by Vercel Cron (or external cron service) every minute.
 *
 * Security: In production, verify CRON_SECRET header.
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret in production
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const authHeader = request.headers.get('authorization');
            if (authHeader !== `Bearer ${cronSecret}`) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 },
                );
            }
        }

        const now = new Date();

        // Find campaigns that are due to be sent
        const dueCampaigns = await prisma.campaign.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: { lte: now },
            },
        });

        if (dueCampaigns.length === 0) {
            return NextResponse.json({
                message: 'No scheduled campaigns due',
                checked: now.toISOString(),
            });
        }

        console.log(`[CRON] Found ${dueCampaigns.length} due campaign(s)`);

        const results = [];

        for (const campaign of dueCampaigns) {
            // Extract groupIds from theme if stored there
            const theme = (campaign.theme as Record<string, unknown>) || {};
            const groupIds =
                (theme.scheduledGroupIds as number[] | null) || null;

            console.log(
                `[CRON] Processing campaign "${campaign.name}"` +
                    (groupIds
                        ? ` (groups: ${groupIds.join(', ')})`
                        : ' (all contacts)'),
            );

            // Create or get send job
            let sendJob = await prisma.sendJob.findUnique({
                where: { campaignId: campaign.id },
            });

            if (!sendJob) {
                // Count total contacts
                const contactWhere: {
                    status: string;
                    groups?: { some: { id: { in: number[] } } };
                } = { status: 'SUBSCRIBED' };

                if (groupIds && groupIds.length > 0) {
                    contactWhere.groups = { some: { id: { in: groupIds } } };
                }

                const totalCount = await prisma.contact.count({
                    where: contactWhere,
                });

                sendJob = await prisma.sendJob.create({
                    data: {
                        campaignId: campaign.id,
                        totalCount,
                        status: 'SENDING',
                        error: groupIds ? JSON.stringify({ groupIds }) : null,
                    },
                });
            } else if (sendJob.status === 'PENDING') {
                await prisma.sendJob.update({
                    where: { id: sendJob.id },
                    data: { status: 'SENDING' },
                });
            }

            // Process batches until complete (with time limit)
            const startTime = Date.now();
            const timeLimit = 50000; // 50 seconds (Vercel function timeout is 60s on Pro)
            let isComplete = false;
            let totalSent = sendJob.sentCount;
            let totalFailed = sendJob.failedCount;

            while (!isComplete && Date.now() - startTime < timeLimit) {
                const batchResult = await processCampaignBatch(
                    campaign,
                    groupIds,
                );

                totalSent += batchResult.sentCount;
                totalFailed += batchResult.failedCount;
                isComplete = batchResult.isComplete;

                await prisma.sendJob.update({
                    where: { id: sendJob.id },
                    data: {
                        sentCount: totalSent,
                        failedCount: totalFailed,
                        lastBatchAt: new Date(),
                        status: isComplete ? 'COMPLETED' : 'SENDING',
                    },
                });

                if (isComplete) {
                    await prisma.campaign.update({
                        where: { id: campaign.id },
                        data: { status: 'SENT', sentAt: new Date() },
                    });
                }
            }

            results.push({
                campaignId: campaign.id,
                campaignName: campaign.name,
                sentCount: totalSent,
                failedCount: totalFailed,
                isComplete,
            });
        }

        return NextResponse.json({
            message: 'Processed scheduled campaigns',
            checked: now.toISOString(),
            results,
        });
    } catch (error) {
        console.error('[CRON] Error processing scheduled campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to process scheduled campaigns' },
            { status: 500 },
        );
    }
}
