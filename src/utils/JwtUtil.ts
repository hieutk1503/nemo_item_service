import jwt from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const getExpiresIn = () => process.env.JWT_EXPIRES_IN; 
const getRefreshExpiresIn = () => process.env.JWT_REFRESH_EXPIRES_IN;

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

// Hàm gốc
export const generateToken = (payload: object, expiresIn: any): string => {
    return jwt.sign(payload, getSecret(), {
        expiresIn: expiresIn, 
        issuer: 'gaming-core',
    });
};

// Access Token
export const generateAccessToken = (
    msisdn: string, 
    username: string | null, 
    fullName: string | null, 
    gameType: string, 
    additionalData: object = {}
): string => {
    // [FIX]: Gọi getExpiresIn() để lấy đúng cấu hình env
    return generateToken({
        msisdn, username, fullName, gameType, type: 'access', ...additionalData
    }, getExpiresIn());
};

// Refresh Token
export const generateRefreshToken = (
    msisdn: string, 
    username: string | null, 
    fullName: string | null, 
    gameType: string
): string => {
    return generateToken({
        msisdn, username, fullName, gameType, type: 'refresh'
    }, getRefreshExpiresIn());
};

// [FIX 2]: Bỏ Try-Catch. Để error gốc "nổi" lên cho Middleware xử lý.
export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, getSecret(), {
        issuer: 'gaming-core'
    }) as TokenPayload;
};

export const decodeToken = (token: string): any => {
    return jwt.decode(token);
};

export const refreshAccessToken = (refreshToken: string): string => {
    const decoded = verifyToken(refreshToken); // Tự throw lỗi nếu hết hạn

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