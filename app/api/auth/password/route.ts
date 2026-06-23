import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

// Hardcoded fallback password
const FALLBACK_PASSWORD = 'LookOut2024!';

export async function POST(request: Request) {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || FALLBACK_PASSWORD;

    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 },
        );
    }

    // Check password
    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 },
        );
    }

    // Check if admin exists
    const admin = await prisma.contact.findFirst({
        where: {
            email: email.toLowerCase(),
            isAdmin: true,
        },
    });

    if (!admin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 401 });
    }

    // Create session and set cookie
    const token = await createSessionToken();
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
}
