// @ts-ignore
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

        const newCampaign = await prisma.campaign.create({
            data: {
                name: `${campaign.name} (Copy)`,
                subject: campaign.subject,
                htmlContent: campaign.htmlContent,
                status: 'DRAFT',
            },
        });

        return NextResponse.json(newCampaign);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to replicate campaign' },
            { status: 500 },
        );
    }
}
