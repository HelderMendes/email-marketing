import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/campaigns/[id]/send/status
 *
 * Returns the current status of a send job.
 * The frontend polls this to show progress.
 *
 * 📝 Teaching note: This is a "read-only" endpoint.
 * It doesn't change state, just reports it.
 * In REST terms, GET = safe & idempotent (can call many times, no side effects).
 */
export async function GET(
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

        if (!campaign.sendJob) {
            return NextResponse.json({
                status: 'NO_JOB',
                message: 'No send job exists for this campaign',
            });
        }

        const job = campaign.sendJob;
        const progress =
            job.totalCount > 0
                ? Math.round((job.sentCount / job.totalCount) * 100)
                : 0;

        return NextResponse.json({
            status: job.status,
            sentCount: job.sentCount,
            failedCount: job.failedCount,
            totalCount: job.totalCount,
            progress,
            lastBatchAt: job.lastBatchAt,
            error: job.error,
        });
    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json(
            { error: 'Failed to get status' },
            { status: 500 },
        );
    }
}
