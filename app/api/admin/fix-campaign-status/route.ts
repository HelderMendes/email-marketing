import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/fix-campaign-status - shows campaigns that need fixing
// POST /api/admin/fix-campaign-status?id=4 - fixes campaign 4

export async function GET() {
    const campaigns = await prisma.campaign.findMany({
        select: {
            id: true,
            name: true,
            status: true,
            sentAt: true,
            _count: { select: { emails: true } },
        },
        orderBy: { id: 'desc' },
    });

    const needsFix = campaigns.filter(
        (c) => c._count.emails > 0 && c.status !== 'SENT',
    );

    return NextResponse.json({
        allCampaigns: campaigns,
        needsFix,
    });
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const campaign = await prisma.campaign.update({
        where: { id: parseInt(id) },
        data: {
            status: 'SENT',
            sentAt: new Date(),
        },
    });

    return NextResponse.json({
        success: true,
        campaign: { id: campaign.id, name: campaign.name, status: campaign.status },
    });
}
