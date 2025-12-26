
/**
 * Security Middleware Diagnostic Tool
 * Used to verify that the Express Proxy correctly verifies JWTs
 * and forwards requests to Flask/Express backends.
 */

async function verifyAccess() {
    console.log("=== Security Middleware Diagnostic ===");

    // 1. Check if token exists in localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {
        console.error("❌ No auth token found. Please log in first.");
        return;
    }

    const token = JSON.parse(authStorage).state?.accessToken;
    if (!token) {
        console.error("❌ Access token is null.");
        return;
    }
    console.log("✅ Auth token detected.");

    // 2. Test Express Native Protected Route
    console.log("\n[Test 1] Express Protected Route (/e-api/v1/jlpt/exams)...");
    try {
        const res = await fetch('/e-api/v1/jlpt/exams?is_public=true', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            console.log("✅ Express Access Success (200 OK)");
        } else {
            const err = await res.json();
            console.error(`❌ Express Access Failed (${res.status}):`, err);
        }
    } catch (e) {
        console.error("❌ Connection error to Express:", e);
    }

    // 3. Test Flask Proxy via Express (/e-api/v1/f/...)
    console.log("\n[Test 2] Flask Proxy via Express (/e-api/v1/f/decks)...");
    try {
        const res = await fetch('/e-api/v1/f/decks?access=PUBLIC', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            console.log("✅ Flask Proxy Success (200 OK)");
        } else {
            const err = await res.json();
            console.error(`❌ Flask Proxy Failed (${res.status}):`, err);
        }
    } catch (e) {
        console.error("❌ Connection error to Proxy:", e);
    }

    console.log("\n=== Diagnostic Complete ===");
}

// Attach to window for easy console execution
if (typeof window !== 'undefined') {
    (window as any).verifySecurityAccess = verifyAccess;
    console.log("🛠️ Security Diagnostic loaded. Run 'await verifySecurityAccess()' in console.");
}

export { verifyAccess };
