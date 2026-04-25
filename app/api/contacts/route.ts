import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const groupId = searchParams.get('groupId');
        const status = searchParams.get('status');

        const where: {
            email?: { contains: string; mode: 'insensitive' };
            OR?: Array<{
                email?: { contains: string; mode: 'insensitive' };
                firstName?: { contains: string; mode: 'insensitive' };
                lastName?: { contains: string; mode: 'insensitive' };
            }>;
            groups?: { some: { id: number } };
            status?: string;
        } = {};

        // Search across email, firstName, lastName
        if (search && search.trim()) {
            where.OR = [
                { email: { contains: search.trim(), mode: 'insensitive' } },
                { firstName: { contains: search.trim(), mode: 'insensitive' } },
                { lastName: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }

        // Filter by group
        if (groupId) {
            where.groups = { some: { id: parseInt(groupId) } };
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        const contacts = await prisma.contact.findMany({
            where,
            include: {
                groups: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contacts' },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Assuming body is a single contact or array? For now single creation via manual add.
        // Or bulk if array.

        if (Array.isArray(body)) {
            // Bulk create not fully implemented in this example but structure is here
            const result = await prisma.contact.createMany({
                data: body,
                skipDuplicates: true,
            });
            return NextResponse.json(result);
        }

        const {
            email,
            firstName,
            lastName,
            tags,
            status,
            source,
            consentGiven,
        } = body;

        const contact = await prisma.contact.create({
            data: {
                email,
                firstName,
                lastName,
                tags,
                status: status || 'SUBSCRIBED',
                source: source || 'MANUAL',
                consentGiven: consentGiven || false,
                consentDate: consentGiven ? new Date() : null,
            },
        });
        return NextResponse.json(contact);
    } catch (error) {
        console.error('Error creating contact:', error);

        // Check for duplicate email error
        if (
            error instanceof Error &&
            error.message.includes('Unique constraint')
        ) {
            return NextResponse.json(
                { error: 'A contact with this email already exists' },
                { status: 409 },
            );
        }

        const message =
            error instanceof Error ? error.message : 'Failed to create contact';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            await prisma.contact.delete({ where: { id: parseInt(id) } });
            return NextResponse.json({ success: true });
        }

        // Bulk delete logic would go here (e.g. passing ids in body)
        const body = await request.json().catch(() => null);
        if (body && Array.isArray(body.ids)) {
            await prisma.contact.deleteMany({
                where: {
                    id: { in: body.ids },
                },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete contact' },
            { status: 500 },
        );
    }
}
