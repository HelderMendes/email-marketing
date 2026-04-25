import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-change-in-production'
);

const COOKIE_NAME = 'admin_session';

const PUBLIC_PATHS = [
    '/',
    '/campaigns/archive',
    '/c',
    '/unsubscribe',
    '/preferences',
    '/api/subscribe',
    '/api/auth',
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(path => {
        if (path === '/') return pathname === '/';
        return pathname === path || pathname.startsWith(path + '/');
    });
}

function isProtectedPath(pathname: string): boolean {
    return (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api/campaigns') ||
        pathname.startsWith('/api/contacts') ||
        pathname.startsWith('/api/groups') ||
        pathname.startsWith('/api/upload')
    );
}

async function verifyToken(token: string): Promise<boolean> {
    try {
        await jwtVerify(token, JWT_SECRET);
        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow login page
    if (pathname === '/admin/login') {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (token && await verifyToken(token)) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.next();
    }

    // Check if path is public
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // Check if path needs protection
    if (isProtectedPath(pathname)) {
        const token = request.cookies.get(COOKIE_NAME)?.value;

        if (!token || !(await verifyToken(token))) {
            // For API routes, return 401
            if (pathname.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            // For pages, redirect to login
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/campaigns/:path*',
        '/api/contacts/:path*',
        '/api/groups/:path*',
        '/api/upload/:path*',
    ],
};
