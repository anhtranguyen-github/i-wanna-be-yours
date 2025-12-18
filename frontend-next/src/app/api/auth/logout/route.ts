import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:8000';

export async function POST() {
    try {
        const refreshToken = cookies().get('refreshToken')?.value;

        // Fire and forget logout on backend
        if (refreshToken) {
            await fetch(`${EXPRESS_API_URL}/e-api/v1/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
        }

        cookies().delete('accessToken');
        cookies().delete('refreshToken');

        return NextResponse.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
