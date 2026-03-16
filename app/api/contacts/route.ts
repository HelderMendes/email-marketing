import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const contacts = await prisma.contact.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(contacts);
    } catch (error) {
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

        const { email, firstName, lastName, tags, status, source } = body;

        const contact = await prisma.contact.create({
            data: {
                email,
                firstName,
                lastName,
                tags,
                status: status || 'SUBSCRIBED',
                source: source || 'MANUAL',
            },
        });
        return NextResponse.json(contact);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create contact' },
            { status: 500 },
        );
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
