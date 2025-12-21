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

// Dispatch session expired event
export function dispatchSessionExpired(reason?: string) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
            detail: { reason: reason || 'Session expired' }
        }));
    }
}

// Clear auth session (call logout endpoint to clear cookies)
async function clearSession() {
    try {
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
        console.warn('[AuthFetch] 401 received, clearing session and prompting login');

        // Clear the invalid session
        await clearSession();

        // Dispatch event so UI can react (show login modal)
        dispatchSessionExpired('Your session has expired. Please log in again.');

        // Return the original response so caller can handle it if needed
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
