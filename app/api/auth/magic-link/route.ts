import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const RESEND_API_URL = 'https://api.resend.com/emails';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 },
            );
        }

        // Find admin contact
        const contact = await prisma.contact.findFirst({
            where: {
                email: email.toLowerCase().trim(),
                isAdmin: true,
            },
        });

        // Always return success to prevent email enumeration
        if (!contact) {
            console.log(`[MAGIC LINK] No admin contact found for: ${email}`);
            return NextResponse.json({ success: true });
        }

        // Generate token and set expiry (15 minutes)
        const token = randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 15 * 60 * 1000);

        // Save token to contact
        await prisma.contact.update({
            where: { id: contact.id },
            data: {
                adminToken: token,
                adminTokenExpiry: expiry,
            },
        });

        // Send magic link email using Resend API
        const loginUrl = `${APP_URL}/api/auth/verify?token=${token}`;
        const fromEmail =
            process.env.SENDER_FROM_EMAIL || 'info@lookoutmode.nl';
        const fromName = process.env.SENDER_FROM_NAME || 'Look Out Mode';

        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [contact.email],
                subject: 'Your Admin Login Link',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">Admin Login</h2>
                        <p>Click the button below to log in to the admin area:</p>
                        <a href="${loginUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                            Log In to Admin
                        </a>
                        <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
                        <p style="color: #999; font-size: 12px;">If you didn't request this link, you can safely ignore this email.</p>
                    </div>
                `,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to send magic link email:', errorData);
        } else {
            console.log(`[MAGIC LINK] Sent to: ${contact.email}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Magic link error:', error);
        return NextResponse.json(
            { error: 'An error occurred' },
            { status: 500 },
        );
    }
}
