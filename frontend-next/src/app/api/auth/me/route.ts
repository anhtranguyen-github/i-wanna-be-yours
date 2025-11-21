import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const accessToken = cookies().get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json({ user: null });
        }

        const payload = await verifyAccessToken(accessToken);

        if (!payload) {
            return NextResponse.json({ user: null });
        }

        const user = {
            id: payload.userId || payload.id,
            email: payload.email,
            role: payload.role,
            is_verified: payload.is_verified || false
        };

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Me error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
