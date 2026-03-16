import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const campaigns = await prisma.campaign.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                status: true,
                sentAt: true,
                scheduledAt: true,
                createdAt: true,
                // Not sending htmlContent here for performance
            },
        });
        return NextResponse.json(campaigns);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, subject, htmlContent } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 },
            );
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                subject: subject || 'No Subject',
                htmlContent: htmlContent || '',
                status: 'DRAFT',
            },
        });
        return NextResponse.json(campaign);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 },
        );
    }
}
