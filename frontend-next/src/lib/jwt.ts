import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-development-secret-key');
const ALG = 'HS256';

export async function createAccessToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('15m') // Short-lived access token
        .sign(SECRET_KEY);
}

export async function verifyAccessToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (error) {
        return null;
    }
}
