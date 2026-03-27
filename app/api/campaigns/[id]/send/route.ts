import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * POST /api/campaigns/[id]/send
 *
 * Creates a SendJob for the campaign. This is the "start" action.
 * The frontend will then poll /batch to process emails in chunks.
 *
 * 📝 Teaching note: This is called "job-based architecture" — we separate
 * the "intent to do work" (creating the job) from "doing the work" (batch endpoint).
 * This pattern is fundamental for any operation that might take longer than a request timeout.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const campaignId = parseInt(id);

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

        if (campaign.status === 'SENT') {
            return NextResponse.json(
                { error: 'Campaign already sent' },
                { status: 400 },
            );
        }

        // Check if there's already an active job
        if (
            campaign.sendJob &&
            ['PENDING', 'SENDING'].includes(campaign.sendJob.status)
        ) {
            return NextResponse.json({
                jobId: campaign.sendJob.id,
                status: campaign.sendJob.status,
                message: 'Send job already in progress',
            });
        }

        // Count subscribed contacts
        const totalCount = await prisma.contact.count({
            where: { status: 'SUBSCRIBED' },
        });

        if (totalCount === 0) {
            return NextResponse.json(
                { error: 'No subscribed contacts to send to' },
                { status: 400 },
            );
        }

        // Delete old job if exists (e.g., from a failed previous attempt)
        if (campaign.sendJob) {
            await prisma.sendJob.delete({
                where: { id: campaign.sendJob.id },
            });
        }

        // Create new SendJob
        const sendJob = await prisma.sendJob.create({
            data: {
                campaignId,
                totalCount,
                status: 'PENDING',
            },
        });

        console.log(
            `[SEND JOB] Created job ${sendJob.id} for campaign "${campaign.name}" — ${totalCount} contacts`,
        );

        return NextResponse.json({
            jobId: sendJob.id,
            totalCount,
            status: 'PENDING',
        });
    } catch (error) {
        console.error('Send job creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create send job' },
            { status: 500 },
        );
    }
}
