import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trackingId: string }> },
) {
    const { trackingId } = await params;
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        // Find the campaign email
        const campaignEmail = await prisma.campaignEmail.findUnique({
            where: { trackingId },
        });

        if (campaignEmail) {
            // Log the click
            await prisma.emailClick.create({
                data: {
                    campaignEmailId: campaignEmail.id,
                    url: url,
                },
            });

            // Update campaign email stats
            await prisma.campaignEmail.update({
                where: { id: campaignEmail.id },
                data: {
                    clickedAt: campaignEmail.clickedAt || new Date(),
                    clickCount: { increment: 1 },
                    status: 'CLICKED',
                },
            });
        }
    } catch (error) {
        // Silently fail - still redirect the user
        console.error('Failed to track click:', error);
    }

    // Redirect to the actual URL
    return NextResponse.redirect(url);
}
