import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type ScheduleRequestBody = {
    groupIds: number[] | null;
    scheduledAt: string;
};

/**
 * POST /api/campaigns/[id]/schedule
 *
 * Schedules a campaign to be sent at a specific time.
 * The campaign will be picked up by the cron job when the time comes.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const campaignId = parseInt(id);

        const body = (await request.json()) as ScheduleRequestBody;
        const { groupIds, scheduledAt } = body;

        if (!scheduledAt) {
            return NextResponse.json(
                { error: 'scheduledAt is required' },
                { status: 400 },
            );
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid scheduledAt date' },
                { status: 400 },
            );
        }

        if (scheduledDate <= new Date()) {
            return NextResponse.json(
                { error: 'Scheduled time must be in the future' },
                { status: 400 },
            );
        }

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
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

        // Update campaign with scheduled time and store group selection
        const existingTheme = (campaign.theme as Record<string, unknown>) || {};
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: 'SCHEDULED',
                scheduledAt: scheduledDate,
                // Store groupIds in theme temporarily (or add a scheduledGroupIds field later)
                theme: groupIds
                    ? { ...existingTheme, scheduledGroupIds: groupIds }
                    : { ...existingTheme, scheduledGroupIds: null },
            },
        });

        console.log(
            `[SCHEDULE] Campaign "${campaign.name}" scheduled for ${scheduledDate.toISOString()}` +
                (groupIds
                    ? ` (groups: ${groupIds.join(', ')})`
                    : ' (all contacts)'),
        );

        return NextResponse.json({
            success: true,
            scheduledAt: scheduledDate.toISOString(),
            message: 'Campaign scheduled successfully',
        });
    } catch (error) {
        console.error('Schedule campaign error:', error);
        return NextResponse.json(
            { error: 'Failed to schedule campaign' },
            { status: 500 },
        );
    }
}

/**
 * DELETE /api/campaigns/[id]/schedule
 *
 * Cancels a scheduled campaign.
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const campaignId = parseInt(id);

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 },
            );
        }

        if (campaign.status !== 'SCHEDULED') {
            return NextResponse.json(
                { error: 'Campaign is not scheduled' },
                { status: 400 },
            );
        }

        // Remove scheduled time and reset to draft
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: 'DRAFT',
                scheduledAt: null,
            },
        });

        console.log(`[SCHEDULE] Campaign "${campaign.name}" unscheduled`);

        return NextResponse.json({
            success: true,
            message: 'Campaign unscheduled successfully',
        });
    } catch (error) {
        console.error('Unschedule campaign error:', error);
        return NextResponse.json(
            { error: 'Failed to unschedule campaign' },
            { status: 500 },
        );
    }
}
