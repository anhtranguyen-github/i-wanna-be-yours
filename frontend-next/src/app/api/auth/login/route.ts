import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Proxy to Express Backend
        const res = await fetch(`${EXPRESS_API_URL}/e-api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const error = await res.json();
            return NextResponse.json(error, { status: res.status });
        }

        const data = await res.json();
        const { accessToken, refreshToken, user } = data;

        // Set cookies (Server-side in Next.js)
        cookies().set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60, // 15 minutes
            path: '/',
        });

        cookies().set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Login Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
