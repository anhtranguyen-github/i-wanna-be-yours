import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Proxy to Express Backend
        const res = await fetch(`${EXPRESS_API_URL}/e-api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Registration Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
