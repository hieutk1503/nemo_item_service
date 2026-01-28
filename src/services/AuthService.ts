import prisma from '../configs/PrismaContext'; // Default import không dùng { }
import { ServiceResponse } from '../utils/ServiceResponse';
import jwt from 'jsonwebtoken';

export class AuthService {
  static async launchGame(payload: { msisdn: string; fullName: string; lang: string; gameType: string }) {
    try {
      // 1. Upsert User dựa trên msisdn
      const user = await prisma.user.upsert({
        where: { msisdn: payload.msisdn },
        update: {
          lastLogin: new Date(),
          fullName: payload.fullName,
          lang: payload.lang
        },
        create: {
          msisdn: payload.msisdn,
          fullName: payload.fullName,
          lang: payload.lang
        }
      });

      // 2. Tạo JWT Token
      const token = jwt.sign(
        { msisdn: user.msisdn, fullName: user.fullName },
        process.env.JWT_SECRET || 'nemo_secret_2026',
        { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '24h' }
      );

      // 3. Xây dựng URL Webgame
      const webUrl = `${process.env.WEBGAME_URL}/?token=${token}&lang=${payload.lang}&game=${payload.gameType}`;

      // 4. Trả về Success 
      return ServiceResponse.Success({ web_url: webUrl }, "Thành công");

    } catch (error: any) {
      console.error("[AuthService] Error:", error);
      // Trả về Fail
      return ServiceResponse.Fail("Internal Server Error");
    }
  }
}