import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * POST /api/groups/[id]/contacts
 * Add contacts to a group
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);
        const body = await request.json();
        const { contactIds } = body;

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return NextResponse.json(
                { error: 'Contact IDs array is required' },
                { status: 400 },
            );
        }

        const group = await prisma.contactGroup.update({
            where: { id: groupId },
            data: {
                contacts: {
                    connect: contactIds.map((id: number) => ({ id })),
                },
            },
            include: {
                _count: { select: { contacts: true } },
            },
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error adding contacts to group:', error);
        return NextResponse.json(
            { error: 'Failed to add contacts to group' },
            { status: 500 },
        );
    }
}

/**
 * DELETE /api/groups/[id]/contacts
 * Remove contacts from a group
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);
        const body = await request.json();
        const { contactIds } = body;

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return NextResponse.json(
                { error: 'Contact IDs array is required' },
                { status: 400 },
            );
        }

        const group = await prisma.contactGroup.update({
            where: { id: groupId },
            data: {
                contacts: {
                    disconnect: contactIds.map((id: number) => ({ id })),
                },
            },
            include: {
                _count: { select: { contacts: true } },
            },
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error removing contacts from group:', error);
        return NextResponse.json(
            { error: 'Failed to remove contacts from group' },
            { status: 500 },
        );
    }
}
