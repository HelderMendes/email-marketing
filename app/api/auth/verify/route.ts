import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login?error=invalid', request.url));
        }

        // Find contact with this token
        const contact = await prisma.contact.findFirst({
            where: {
                adminToken: token,
                isAdmin: true,
            },
        });

        if (!contact) {
            return NextResponse.redirect(new URL('/admin/login?error=invalid', request.url));
        }

        // Check if token is expired
        if (!contact.adminTokenExpiry || contact.adminTokenExpiry < new Date()) {
            // Clear expired token
            await prisma.contact.update({
                where: { id: contact.id },
                data: {
                    adminToken: null,
                    adminTokenExpiry: null,
                },
            });
            return NextResponse.redirect(new URL('/admin/login?error=expired', request.url));
        }

        // Clear the token (single use)
        await prisma.contact.update({
            where: { id: contact.id },
            data: {
                adminToken: null,
                adminTokenExpiry: null,
            },
        });

        // Create session
        const sessionToken = await createSessionToken();
        await setSessionCookie(sessionToken);

        return NextResponse.redirect(new URL('/admin', request.url));
    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.redirect(new URL('/admin/login?error=unknown', request.url));
    }
}
