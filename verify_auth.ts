import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/auth';
let cookie = '';

async function testAuth() {
    console.log('Starting Auth Verification...');

    // 1. Register
    console.log('\n1. Testing Registration...');
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';

    const registerRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    console.log('Register Status:', registerRes.status);
    const registerData = await registerRes.json();
    console.log('Register Data:', registerData);

    if (registerRes.status !== 201) {
        console.error('Registration failed');
        // return; // Continue to try login anyway
    }

    // 2. Login
    console.log('\n2. Testing Login...');
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    console.log('Login Status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login Data:', loginData);

    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
        cookie = setCookie;
        console.log('Cookies received');
    } else {
        console.error('No cookies received');
    }

    // 3. Me (Protected Route)
    console.log('\n3. Testing /me endpoint...');
    const meRes = await fetch(`${BASE_URL}/me`, {
        headers: { Cookie: cookie },
    });
    console.log('Me Status:', meRes.status);
    const meData = await meRes.json();
    console.log('Me Data:', meData);

    // 4. Logout
    console.log('\n4. Testing Logout...');
    const logoutRes = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: { Cookie: cookie },
    });
    console.log('Logout Status:', logoutRes.status);

    // 5. Me after Logout
    console.log('\n5. Testing /me after logout...');
    const meAfterLogoutRes = await fetch(`${BASE_URL}/me`, {
        headers: { Cookie: cookie }, // Cookie might still be sent but should be invalid or cleared on client
    });
    console.log('Me After Logout Status:', meAfterLogoutRes.status);
    const meAfterLogoutData = await meAfterLogoutRes.json();
    console.log('Me After Logout Data:', meAfterLogoutData);
}

testAuth();
