import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Interface cho dữ liệu trong Token
 */
export interface TokenPayload {
    msisdn: string;
    username: string | null; 
    fullName: string | null;
    gameType: string;
    type: 'access' | 'refresh';
    role?: string;
    permissions?: string[];
    [key: string]: any;
}

/**
 * Hàm gốc tạo token (Internal use)
 */
export const generateToken = (payload: object, expiresIn: any = JWT_EXPIRES_IN): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn,
        issuer: 'gaming-core',
    });
};

/**
 * Tạo Access Token
 * Input: msisdn, username, fullName, gameType
 */
export const generateAccessToken = (
    msisdn: string, 
    username: string | null, 
    fullName: string | null, 
    gameType: string, 
    additionalData: object = {}
): string => {
    return generateToken({
        msisdn,
        username,
        fullName,
        gameType,
        type: 'access',
        ...additionalData
    }, JWT_EXPIRES_IN);
};

/**
 * Tạo Refresh Token
 */
export const generateRefreshToken = (
    msisdn: string, 
    username: string | null, 
    fullName: string | null, 
    gameType: string
): string => {
    return generateToken({
        msisdn,
        username,
        fullName,
        gameType,
        type: 'refresh'
    }, JWT_REFRESH_EXPIRES_IN);
};

/**
 * Verify Token (Kiểm tra tính hợp lệ)
 */
export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'gaming-core'
        }) as TokenPayload;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw error;
        }
    }
};

/**
 * Decode Token (Không verify, chỉ đọc dữ liệu)
 */
export const decodeToken = (token: string): any => {
    return jwt.decode(token);
};

/**
 * Refresh Access Token từ Refresh Token cũ
 */
export const refreshAccessToken = (refreshToken: string): string => {
    const decoded = verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
    }

    return generateAccessToken(
        decoded.msisdn, 
        decoded.username, 
        decoded.fullName, 
        decoded.gameType
    );
};