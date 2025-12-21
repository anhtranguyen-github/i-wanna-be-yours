'use client';

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
    const { skipAuthCheck, ...fetchOptions } = options;

    const response = await fetch(url, fetchOptions);

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
