import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { renderEmailHtml, EmailTheme } from '@/lib/email-renderer';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
        where: { id: parseInt(id) },
    });

    if (!campaign) {
        return new NextResponse('Not found', { status: 404 });
    }

    // Get origin from request URL for correct logo paths
    const url = new URL(request.url);
    const appUrl = `${url.protocol}//${url.host}`;

    const html = renderEmailHtml(
        campaign.htmlContent || '',
        (campaign.theme as unknown as EmailTheme) || undefined,
        { campaignId: campaign.id, appUrl },
    );

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html',
        },
    });
}
