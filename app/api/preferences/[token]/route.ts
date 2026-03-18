import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        const { token } = await params;
        const body = await request.json();
        const { firstName, lastName, status } = body;

        const contact = await prisma.contact.findUnique({
            where: { unsubscribeToken: token },
        });

        if (!contact) {
            return NextResponse.json(
                { error: 'Contact not found' },
                { status: 404 },
            );
        }

        const updated = await prisma.contact.update({
            where: { id: contact.id },
            data: {
                firstName: firstName ?? contact.firstName,
                lastName: lastName ?? contact.lastName,
                status: status ?? contact.status,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 },
        );
    }
}
