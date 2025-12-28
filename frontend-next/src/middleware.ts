import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/jwt';

/**
 * Senior Next.js Engineer Note:
 * The net::ERR_CONNECTION_RESET error on static assets (like /_next/static/chunks/webpack.js)
 * typically occurs when the Next.js middleware attempts to run authentication logic on 
 * JavaScript bundles, CSS files, or other internal Next.js assets. 
 * 
 * To fix this, we implement a strict exclusion policy in both the middleware matcher
 * and the middleware function itself, ensuring that static assets are served directly
 * by the Next.js server without any authentication overhead.
 */

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
    '/profile',
    '/admin',
    '/study-plan/dashboard',
    '/settings',
];

// Define public routes that must always be accessible
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/about',
    '/privacy-policy',
    '/terms-of-service',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. FAST PATH: Always allow static assets and internal Next.js paths
    // Even though the matcher should catch most of these, we add an extra layer of safety here.
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/f-api') ||
        pathname.startsWith('/e-api') ||
        pathname.startsWith('/h-api') ||
        pathname.startsWith('/s-api') ||
        pathname.startsWith('/d-api') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/public') ||
        pathname.includes('.') || // Matches files with extensions (png, jpg, js, css, etc.)
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml'
    ) {
        return NextResponse.next();
    }

    // 2. Identification: Is the requested route protected?
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    if (isProtected) {
        // Retrieve the access token from cookies
        const accessToken = request.cookies.get('accessToken')?.value;

        // If no token exists, redirect to home with an auth trigger
        // Note: According to the 'unify_login_workflow', we avoid directing to /login
        // and instead let the landing page or a modal handle it.
        if (!accessToken) {
            const url = new URL('/', request.url);
            url.searchParams.set('auth', 'login');
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }

        try {
            // Verify the token using 'jose' (Edge-compatible)
            const payload = await verifyAccessToken(accessToken);

            if (!payload) {
                // Invalid or expired token
                const response = NextResponse.redirect(new URL('/?auth=login&error=session_expired', request.url));
                response.cookies.delete('accessToken'); // Clean up stale cookie
                return response;
            }
        } catch (error) {
            console.error('Middleware auth verification failed:', error);
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

/**
 * Matcher configuration is the primary defense against ERR_CONNECTION_RESET.
 * We explicitly exclude internal paths and static file patterns.
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (internal API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public|images|assets).*)',
    ],
};
