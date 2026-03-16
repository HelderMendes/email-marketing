import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
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

        return NextResponse.json(campaign);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch campaign' },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, htmlContent, subject, status } = body;

        const campaign = await prisma.campaign.update({
            where: { id: parseInt(id) },
            data: {
                name,
                htmlContent,
                subject,
                status,
            },
        });

        return NextResponse.json(campaign);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update campaign' },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        await prisma.campaign.delete({
            where: { id: parseInt(id) },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete campaign' },
            { status: 500 },
        );
    }
}
