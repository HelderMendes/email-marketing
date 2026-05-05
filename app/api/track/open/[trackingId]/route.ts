import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64',
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trackingId: string }> },
) {
    const { trackingId } = await params;

    try {
        // Update the email record if not already opened
        await prisma.campaignEmail.updateMany({
            where: {
                trackingId,
                openedAt: null,
            },
            data: {
                openedAt: new Date(),
                status: 'OPENED',
            },
        });
    } catch (error) {
        // Silently fail - don't break the email display
        console.error('Failed to track open:', error);
    }

    // Return transparent 1x1 GIF
    return new Response(TRANSPARENT_GIF, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control':
                'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        },
    });
}
