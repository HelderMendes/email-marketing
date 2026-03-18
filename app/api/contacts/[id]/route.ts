import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email, firstName, lastName, tags, status } = body;

        const contact = await prisma.contact.update({
            where: { id: parseInt(id) },
            data: {
                email,
                firstName,
                lastName,
                tags,
                status,
            },
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
