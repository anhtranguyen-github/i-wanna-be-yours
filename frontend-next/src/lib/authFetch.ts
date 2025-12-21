'use client';

import Cookies from 'js-cookie';

/**
 * AuthenticatedFetch - A fetch wrapper that automatically handles 401 errors
 * 
 * When a 401 (Unauthorized) response is received:
 * 1. Clears the invalid session by calling /api/auth/logout
 * 2. Dispatches a custom event 'auth:session-expired' that the app can listen to
 * 3. Opens the login modal automatically
 * 
 * This eliminates the need for users to manually clear cookies.
 */

// Custom event for session expiry
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

// Flag to prevent event storming
let isSessionExpiring = false;

// Dispatch session expired event
export function dispatchSessionExpired(reason?: string) {
    if (typeof window !== 'undefined' && !isSessionExpiring) {
        isSessionExpiring = true;

        // Reset flag after a delay to allow future expiries
        setTimeout(() => {
            isSessionExpiring = false;
        }, 5000);

        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
            detail: { reason: reason || 'Session expired' }
        }));
    }
}

// Clear auth session (call logout endpoint to clear cookies)
async function clearSession() {
    try {
        // Only attempt network logout if we haven't just done it
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        // Ignore errors during cleanup
        console.warn('Failed to clear session:', e);
    }
}

interface AuthFetchOptions extends RequestInit {
    skipAuthCheck?: boolean; // Skip 401 handling for specific requests (like login itself)
}

/**
 * Wrapper around fetch that handles 401 errors automatically
 */


export async function authFetch(
    url: string | URL | Request,
    options: AuthFetchOptions = {}
): Promise<Response> {
    const { skipAuthCheck, headers, ...fetchOptions } = options;

    // 1. Get Token from localStorage (priority) or cookies (fallback)
    // Note: Cookies must be httpOnly: false for this to work
    const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || Cookies.get('accessToken'))
        : undefined;

    // 2. Prepare Headers
    const authHeaders: HeadersInit = {};
    if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Merge headers (caller's headers take precedence if conflicting, though usually we want to enforce Auth)
    // Note: We cast headers to any to handle HeadersInit complexity
    const mergedHeaders = {
        ...authHeaders,
        ...(headers as any || {})
    };

    // 3. Fetch with injected headers
    const response = await fetch(url, {
        ...fetchOptions,
        headers: mergedHeaders,
        credentials: 'include' // Keep cookies for legacy/backend checks
    });

    // Handle 401 Unauthorized - session expired or invalid token
    if (response.status === 401 && !skipAuthCheck) {
        console.warn(`[AuthFetch] 401 received from ${url.toString()}, initiating session cleanup`);

        // Only perform cleanup actions if we aren't already handling an expiry
        if (!isSessionExpiring) {
            // Dispatch event FIRST to update UI immediately
            dispatchSessionExpired('Your session has expired. Please log in again.');

            // Then clear session in background
            clearSession();
        }
    }

    return response;
}

/**
 * Hook to listen for session expiry events
 * Usage: useSessionExpiry((reason) => { openAuth('LOGIN'); });
 */
export function useSessionExpiry(
    onExpired: (reason: string) => void
) {
    if (typeof window === 'undefined') return;

    const handler = (event: CustomEvent<{ reason: string }>) => {
        onExpired(event.detail.reason);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handler as EventListener);

    return () => {
        window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handler as EventListener);
    };
}
