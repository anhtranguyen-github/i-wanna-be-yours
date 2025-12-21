import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
export { createAccessToken, verifyAccessToken } from './jwt';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function createRefreshToken() {
    return uuidv4(); // Opaque refresh token
}

