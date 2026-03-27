import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderEmailHtml, type EmailTheme } from '@/lib/email-renderer';

const resend = new Resend(process.env.RESEND_API_KEY);

const BATCH_SIZE = 50;

/**
 * POST /api/campaigns/[id]/send/batch
 *
 * Processes the next batch of emails for a SendJob.
 * Called repeatedly by the frontend until all emails are sent.
 *
 * 📝 Teaching note: This is the "worker" part of our job system.
 * Each call processes BATCH_SIZE emails, then returns progress.
 * The frontend polls this endpoint until status is COMPLETED.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const campaignId = parseInt(id);

        // Get campaign with its send job
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { sendJob: true },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 },
            );
        }

        if (!campaign.sendJob) {
            return NextResponse.json(
                {
                    error: 'No send job found. Call /send first to create a job.',
                },
                { status: 400 },
            );
        }

        const job = campaign.sendJob;

        // Check job status
        if (job.status === 'COMPLETED') {
            return NextResponse.json({
                status: 'COMPLETED',
                sentCount: job.sentCount,
                totalCount: job.totalCount,
                failedCount: job.failedCount,
            });
        }

        if (job.status === 'PAUSED') {
            return NextResponse.json({
                status: 'PAUSED',
                sentCount: job.sentCount,
                totalCount: job.totalCount,
                message: 'Job is paused',
            });
        }

        // Mark as SENDING if still PENDING
        if (job.status === 'PENDING') {
            await prisma.sendJob.update({
                where: { id: job.id },
                data: { status: 'SENDING' },
            });
        }

        // Get contacts that haven't been emailed yet for this campaign
        const alreadySentContactIds = await prisma.campaignEmail.findMany({
            where: { campaignId },
            select: { contactId: true },
        });

        const sentIds = alreadySentContactIds.map((e) => e.contactId);

        const contactsToSend = await prisma.contact.findMany({
            where: {
                status: 'SUBSCRIBED',
                id: { notIn: sentIds.length > 0 ? sentIds : [-1] },
            },
            take: BATCH_SIZE,
        });

        // If no contacts left, mark as complete
        if (contactsToSend.length === 0) {
            await prisma.sendJob.update({
                where: { id: job.id },
                data: { status: 'COMPLETED' },
            });

            // Also mark campaign as SENT
            await prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'SENT', sentAt: new Date() },
            });

            return NextResponse.json({
                status: 'COMPLETED',
                sentCount: job.sentCount,
                totalCount: job.totalCount,
                failedCount: job.failedCount,
            });
        }

        // Render the email template once
        const fullHtml = renderEmailHtml(
            campaign.htmlContent || '',
            (campaign.theme as unknown as EmailTheme) || undefined,
            { campaignId: campaign.id },
        );

        let batchSentCount = 0;
        let batchFailedCount = 0;

        // Process this batch
        for (const contact of contactsToSend) {
            const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lookoutmode.nl'}/unsubscribe/${contact.unsubscribeToken}`;
            const preferencesUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lookoutmode.nl'}/preferences/${contact.unsubscribeToken}`;
            const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lookoutmode.nl'}/campaigns/${campaign.id}/webview`;

            const emailHtml = fullHtml
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

            let sendSuccess = false;

            try {
                const result = await resend.emails.send({
                    from:
                        process.env.RESEND_FROM_EMAIL ||
                        'Lookout Mode <hello@helderdesign.nl>',
                    to: [contact.email],
                    subject: campaign.subject || 'No Subject',
                    html: emailHtml,
                    headers: {
                        'List-Unsubscribe': `<${unsubscribeUrl}>`,
                        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                    },
                });

                if (result.error) {
                    console.error(
                        `[BATCH] Failed to send to ${contact.email}:`,
                        result.error,
                    );
                    batchFailedCount++;
                } else {
                    console.log(
                        `[BATCH] Sent to ${contact.email}, ID: ${result.data?.id}`,
                    );
                    sendSuccess = true;
                    batchSentCount++;
                }
            } catch (err) {
                console.error(
                    `[BATCH] Error sending to ${contact.email}:`,
                    err,
                );
                batchFailedCount++;
            }

            // Record the email attempt
            await prisma.campaignEmail.create({
                data: {
                    campaignId,
                    contactId: contact.id,
                    status: sendSuccess ? 'SENT' : 'FAILED',
                    sentAt: new Date(),
                },
            });
        }

        // Update job progress
        const updatedJob = await prisma.sendJob.update({
            where: { id: job.id },
            data: {
                sentCount: { increment: batchSentCount },
                failedCount: { increment: batchFailedCount },
                lastBatchAt: new Date(),
            },
        });

        // Check if we're done
        const totalProcessed = updatedJob.sentCount + updatedJob.failedCount;
        const isComplete = totalProcessed >= updatedJob.totalCount;

        if (isComplete) {
            await prisma.sendJob.update({
                where: { id: job.id },
                data: { status: 'COMPLETED' },
            });

            await prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'SENT', sentAt: new Date() },
            });
        }

        return NextResponse.json({
            status: isComplete ? 'COMPLETED' : 'SENDING',
            sentCount: updatedJob.sentCount,
            failedCount: updatedJob.failedCount,
            totalCount: updatedJob.totalCount,
            batchProcessed: contactsToSend.length,
        });
    } catch (error) {
        console.error('Batch send error:', error);
        return NextResponse.json(
            { error: 'Failed to process batch' },
            { status: 500 },
        );
    }
}
