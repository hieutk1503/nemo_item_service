import prisma from '../configs/PrismaContext';
import { ServiceResponse } from '../utils/ServiceResponse';
import { generateAccessToken } from '../utils/JwtUtil'; // [CHANGE] Import từ JwtUtil
import * as bcrypt from 'bcrypt';

const WEBGAME_URL = process.env.WEBGAME_URL || 'http://localhost:3000';

export class AuthService {

    /**
     * API: In-App / Launch
     */
    static async launchGame(payload: { msisdn: string; fullName: string; lang: string; gameType: string }) {
        try {
            // VALIDATION
            if (!payload) return ServiceResponse.Fail("Payload không được để trống", 400);

            if (!payload.msisdn || typeof payload.msisdn !== 'string') {
                return ServiceResponse.Fail("Thiếu thông tin msisdn hoặc sai định dạng", 400);
            }
            const phoneRegex = /^[0-9]{10,12}$/;
            if (!phoneRegex.test(payload.msisdn)) {
                return ServiceResponse.Fail("Số điện thoại không hợp lệ (Chỉ chấp nhận 10-12 số)", 400);
            }

            let finalName = "Gamer";
            if (payload.fullName && typeof payload.fullName === 'string') {
                finalName = payload.fullName.length > 50 ? payload.fullName.substring(0, 50) : payload.fullName;
            }

            // CHECK TRƯỚC KHI XỬ LÝ 
            let user = await prisma.user.findUnique({
                where: { msisdn: payload.msisdn }
            });

            let isFirstLogin = false;

            if (user) {
                // CASE 1: USER ĐÃ TỒN TẠI -> UPDATE
                isFirstLogin = false;
                
                if (user.status === 'BLOCKED') {
                    return ServiceResponse.Fail("Tài khoản của bạn đã bị khóa", 403);
                }

                // Cập nhật thông tin mới nhất
                user = await prisma.user.update({
                    where: { msisdn: payload.msisdn }, 
                    data: {
                        lastLogin: new Date(),
                        fullName: finalName,
                        lang: payload.lang || 'vi'
                    }
                });

            } else {
                // CASE 2: CHƯA TỒN TẠI -> CREATE
                isFirstLogin = true;

                user = await prisma.user.create({
                    data: {
                        msisdn: payload.msisdn,
                        fullName: finalName,
                        lang: payload.lang || 'vi',
                        firstLogin: true,
                        status: 'ACTIVE'
                    }
                });
            }

            //JwtUtil
            const token = generateAccessToken(
                user!.msisdn,
                user!.username,
                user!.fullName,
                payload.gameType
            );

            // TẠO MAGIC LINK
            const webUrl = `${WEBGAME_URL}/?token=${token}&lang=${payload.lang || 'vi'}&game=${payload.gameType || 'DEFAULT'}&firstLogin=${isFirstLogin}`;

            return ServiceResponse.Success({
                web_url: webUrl,
                firstLogin: isFirstLogin,
                token: token
            }, "Thành công");

        } catch (error: any) {
            console.error("[AuthService] Launch Error:", error);
            return ServiceResponse.Fail("Internal Server Error");
        }
    }

    /**
     * API: Cập nhật mật khẩu
     */
    static async updatePassword(msisdn: string, newPass: string) {
        try {
            if (!newPass || newPass.length < 6) {
                return ServiceResponse.Fail("Mật khẩu phải có ít nhất 6 ký tự", 400);
            }

            const hashedPassword = await bcrypt.hash(newPass, 10);
            
            const user = await prisma.user.findUnique({ where: { msisdn } });
            if (!user) return ServiceResponse.Fail("User không tồn tại", 404);

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
     * API: Lấy Profile
     */
    static async getProfile(msisdn: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { msisdn },
                include: {
                    subscriptions: {
                        where: { status: 1 },
                        include: { plan: true }
                    }
                }
            });

            if (!user) return ServiceResponse.Fail("User not found", 404);
            
            const { password, ...userWithoutPassword } = user;
            return ServiceResponse.Success(userWithoutPassword, "Lấy profile thành công");
        } catch (error) {
            return ServiceResponse.Fail("Lỗi hệ thống khi lấy profile");
        }
    }

    /**
     * API: Đăng ký
     */
    static async register(payload: { username: string; password: string; msisdn: string; fullName: string }) {
        try {
            if (!payload) return ServiceResponse.Fail("Dữ liệu không hợp lệ", 400);
            const { username, password, msisdn, fullName } = payload;

            if (!username || !password || !msisdn) {
                return ServiceResponse.Fail("Vui lòng nhập đủ thông tin", 400);
            }

            const phoneRegex = /^[0-9]{10,12}$/;
            if (!phoneRegex.test(msisdn)) {
                return ServiceResponse.Fail("SĐT không đúng định dạng", 400);
            }

            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [{ username }, { msisdn }]
                }
            });

            if (existingUser) return ServiceResponse.Fail("Tài khoản đã tồn tại", 400);

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    msisdn,
                    fullName: fullName || "New Gamer",
                    firstLogin: false,
                    status: 'ACTIVE',
                    lang: 'vi'
                }
            });

            return ServiceResponse.Success({
                username: newUser.username,
                msisdn: newUser.msisdn
            }, "Đăng ký thành công");

        } catch (error) {
            console.error("[AuthService] Register Error:", error);
            return ServiceResponse.Fail("Lỗi đăng ký");
        }
    }

    /**
     * API: Đăng nhập
     */
    static async login(payload: { username: string; password: string }) {
        try {
            if (!payload || !payload.username || !payload.password) {
                return ServiceResponse.Fail("Thiếu thông tin đăng nhập", 400);
            }

            const { username, password } = payload;

            const user = await prisma.user.findFirst({
                where: {
                    OR: [{ username }, { msisdn: username }]
                }
            });

            if (!user || !user.password) return ServiceResponse.Fail("Sai tài khoản hoặc mật khẩu", 401);

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return ServiceResponse.Fail("Sai tài khoản hoặc mật khẩu", 401);

            //JwtUtil
            const token = generateAccessToken(
                user.msisdn,
                user.username,
                user.fullName,
                'WEB_LOGIN'
            );

            return ServiceResponse.Success({
                token,
                user: {
                    msisdn: user.msisdn,
                    fullName: user.fullName,
                    username: user.username
                }
            }, "Đăng nhập thành công");

        } catch (error) {
            console.error("[AuthService] Login Error:", error);
            return ServiceResponse.Fail("Lỗi đăng nhập");
        }
    }
}