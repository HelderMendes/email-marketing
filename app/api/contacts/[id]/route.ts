import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email, firstName, lastName, tags, status, groupIds } = body;

        const contact = await prisma.contact.update({
            where: { id: parseInt(id) },
            data: {
                email,
                firstName,
                lastName,
                tags,
                status,
                // Update group connections if groupIds is provided
                ...(groupIds !== undefined && {
                    groups: {
                        set: groupIds.map((gid: number) => ({ id: gid })),
                    },
                }),
            },
            include: { groups: true },
        });

        return NextResponse.json(contact);
    } catch (error) {
        console.error('Error updating contact:', error);
        return NextResponse.json(
            { error: 'Failed to update contact' },
            { status: 500 },
        );
    }
}
