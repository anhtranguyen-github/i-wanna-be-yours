import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, createAccessToken, createRefreshToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Find user
        const [users] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create tokens
        const accessToken = await createAccessToken({
            userId: user.id,
            id: user.id,
            email: user.email,
            role: user.role,
            is_verified: user.is_verified
        });
        const refreshToken = await createRefreshToken();

        // Store refresh token in DB
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await pool.query('INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (?, ?, ?)', [user.id, refreshToken, expiresAt]);

        // Set cookies
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

        return NextResponse.json({
            user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified }
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
