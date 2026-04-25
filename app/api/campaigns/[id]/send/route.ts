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

        // Parse request body for group selection
        const body = await request.json().catch(() => ({}));
        const groupIds: number[] | null = body.groupIds || null;

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

        // Build where clause for contacts
        const contactWhere: {
            status: string;
            groups?: { some: { id: { in: number[] } } };
        } = { status: 'SUBSCRIBED' };

        if (groupIds && groupIds.length > 0) {
            contactWhere.groups = { some: { id: { in: groupIds } } };
        }

        // Count subscribed contacts (deduplicated by contact id)
        const totalCount = await prisma.contact.count({
            where: contactWhere,
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

        // Create new SendJob with groupIds stored for batch processing
        const sendJob = await prisma.sendJob.create({
            data: {
                campaignId,
                totalCount,
                status: 'PENDING',
                // Store groupIds as JSON string in error field temporarily
                // (or we can add a new field to the schema later)
                error: groupIds ? JSON.stringify({ groupIds }) : null,
            },
        });

        console.log(
            `[SEND JOB] Created job ${sendJob.id} for campaign "${campaign.name}" — ${totalCount} contacts` +
                (groupIds
                    ? ` (groups: ${groupIds.join(', ')})`
                    : ' (all contacts)'),
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
