import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, firstName, lastName, consent } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 },
            );
        }

        const contact = await prisma.contact.upsert({
            where: { email },
            update: {
                firstName,
                lastName,
                status: 'SUBSCRIBED',
                source: 'FORM',
                consentGiven: consent,
                consentDate: consent ? new Date() : undefined,
                updatedAt: new Date(),
            },
            create: {
                email,
                firstName,
                lastName,
                source: 'FORM',
                status: 'SUBSCRIBED',
                consentGiven: consent,
                consentDate: consent ? new Date() : undefined,
            },
        });

        return NextResponse.json({ success: true, contactId: contact.id });
    } catch (error) {
        console.error('Subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to subscribe' },
            { status: 500 },
        );
    }
}
