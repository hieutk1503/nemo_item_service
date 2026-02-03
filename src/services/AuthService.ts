import prisma from '../configs/PrismaContext';
import { ServiceResponse } from '../utils/ServiceResponse';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { access } from 'node:fs';

export class AuthService {
    static async launchGame(payload: { msisdn: string; fullName: string; lang: string; gameType: string }) {
        try {
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
                    lang: payload.lang,
                    firstLogin: true, 
                    status: 'ACTIVE'
                }
            });

            const token = jwt.sign(
                { msisdn: user.msisdn, fullName: user.fullName, type: 'access' },
                process.env.JWT_SECRET || 'nemo_secret_2026',
                { expiresIn: '24h', issuer: 'gaming-core' }
            );

            const webUrl = `${process.env.WEBGAME_URL}/?token=${token}&lang=${payload.lang}&game=${payload.gameType}&firstLogin=${user.firstLogin}`;

            return ServiceResponse.Success({ 
                web_url: webUrl, 
                firstLogin: user.firstLogin,
                token: token
            }, "Thành công");
        } catch (error: any) {
            return ServiceResponse.Fail("Internal Server Error");
        }
    }

    static async updatePassword(msisdn: string, newPass: string) {
        try {
            const hashedPassword = await bcrypt.hash(newPass, 10);
            await prisma.user.update({
                where: { msisdn: msisdn },
                data: {
                    password: hashedPassword,
                    firstLogin: false 
                }
            });
            return ServiceResponse.Success(null, "Cập nhật mật khẩu thành công");
        } catch (error) {
            return ServiceResponse.Fail("Lỗi cập nhật mật khẩu");
        }
    }
    /**
   * API: Lấy thông tin chi tiết User (Profile)
   */
    static async getProfile(msisdn: string) {
      try {
        const user = await prisma.user.findUnique({
          where: { msisdn },
          include: {
            subscriptions: {
              where: { status: 1 }, // Chỉ lấy gói đang hoạt động
              include: { plan: true }
            }
          }
        });
        
        if (!user) return ServiceResponse.Fail("User not found");
        return ServiceResponse.Success(user, "Lấy profile thành công");
      } catch (error) {
        return ServiceResponse.Fail("Lỗi hệ thống khi lấy profile");
      }
    }
  }