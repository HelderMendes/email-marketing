import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/groups/[id]
 * Fetch a single group with its contacts
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);

        const group = await prisma.contactGroup.findUnique({
            where: { id: groupId },
            include: {
                contacts: {
                    orderBy: { email: 'asc' },
                },
                _count: {
                    select: { contacts: true },
                },
            },
        });

        if (!group) {
            return NextResponse.json(
                { error: 'Group not found' },
                { status: 404 },
            );
        }

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error fetching group:', error);
        return NextResponse.json(
            { error: 'Failed to fetch group' },
            { status: 500 },
        );
    }
}

/**
 * PUT /api/groups/[id]
 * Update a group
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);
        const body = await request.json();
        const { name, description, color } = body;

        const group = await prisma.contactGroup.update({
            where: { id: groupId },
            data: {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && {
                    description: description?.trim() || null,
                }),
                ...(color && { color }),
            },
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error updating group:', error);
        if ((error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: 'A group with this name already exists' },
                { status: 400 },
            );
        }
        return NextResponse.json(
            { error: 'Failed to update group' },
            { status: 500 },
        );
    }
}

/**
 * DELETE /api/groups/[id]
 * Delete a group (does not delete contacts)
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const groupId = parseInt(id);

        await prisma.contactGroup.delete({
            where: { id: groupId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json(
            { error: 'Failed to delete group' },
            { status: 500 },
        );
    }
}
