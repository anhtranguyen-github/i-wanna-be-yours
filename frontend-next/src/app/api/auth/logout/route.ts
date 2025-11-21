import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const refreshToken = cookies().get('refreshToken')?.value;

        if (refreshToken) {
            await pool.query('DELETE FROM sessions WHERE refresh_token = ?', [refreshToken]);
        }

        cookies().delete('accessToken');
        cookies().delete('refreshToken');

        return NextResponse.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
