import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { renderEmailHtml, EmailTheme } from '@/lib/email-renderer';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
        where: { id: parseInt(id) },
    });

    if (!campaign) {
        return new NextResponse('Not found', { status: 404 });
    }

    const html = renderEmailHtml(
        campaign.htmlContent || '',
        (campaign.theme as unknown as EmailTheme) || undefined,
    );

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html',
        },
    });
}
