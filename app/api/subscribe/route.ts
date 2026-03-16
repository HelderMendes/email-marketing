import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, firstName, lastName } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 },
            );
        }

        const contact = await prisma.contact.create({
            data: {
                email,
                firstName,
                lastName,
                source: 'FORM',
                status: 'SUBSCRIBED',
            },
        });

        return NextResponse.json({ success: true, contactId: contact.id });
    } catch (error) {
        console.error('Subscription error:', error);
        // Handle unique constraint error
        return NextResponse.json(
            { error: 'Failed to subscribe or already subscribed' },
            { status: 500 },
        );
    }
}
