import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/groups
 * Fetch all contact groups with contact count
 */
export async function GET() {
    try {
        const groups = await prisma.contactGroup.findMany({
            include: {
                _count: {
                    select: { contacts: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 },
        );
    }
}

/**
 * POST /api/groups
 * Create a new contact group
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, color } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { error: 'Group name is required' },
                { status: 400 },
            );
        }

        const group = await prisma.contactGroup.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || '#6366f1',
            },
        });

        return NextResponse.json(group, { status: 201 });
    } catch (error) {
        console.error('Error creating group:', error);
        if ((error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: 'A group with this name already exists' },
                { status: 400 },
            );
        }
        return NextResponse.json(
            { error: 'Failed to create group' },
            { status: 500 },
        );
    }
}
