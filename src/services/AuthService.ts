import prisma from '../configs/PrismaContext';
import { ServiceResponse } from '../utils/ServiceResponse';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'nemo_secret_2026';

export class AuthService {

    /**
     * API: Khởi tạo Game (Luồng In-App / Launch)
     */
    static async launchGame(payload: { msisdn: string; fullName: string; lang: string; gameType: string }) {
        try {
            // --- 1. VALIDATION ---
            if (!payload) {
                return ServiceResponse.Fail("Payload không được để trống", 400);
            }

            // Validate Số điện thoại (Bắt buộc phải là chuỗi số 10-12 ký tự)
            if (!payload.msisdn || typeof payload.msisdn !== 'string') {
                return ServiceResponse.Fail("Thiếu thông tin msisdn hoặc sai định dạng", 400);
            }
            const phoneRegex = /^[0-9]{10,12}$/;
            if (!phoneRegex.test(payload.msisdn)) {
                return ServiceResponse.Fail("Số điện thoại không hợp lệ (Chỉ chấp nhận 10-12 số)", 400);
            }

            // Tên hiển thị (Tránh tên quá dài hoặc null)
            let finalName = "Gamer";
            if (payload.fullName && typeof payload.fullName === 'string') {
                finalName = payload.fullName.length > 50 ? payload.fullName.substring(0, 50) : payload.fullName;
            }

            // --- 2. LOGIC NGHIỆP VỤ ---
            const user = await prisma.user.upsert({
                where: { msisdn: payload.msisdn },
                update: {
                    lastLogin: new Date(),
                    fullName: finalName,
                    lang: payload.lang || 'vi'
                },
                create: {
                    msisdn: payload.msisdn,
                    fullName: finalName,
                    lang: payload.lang || 'vi',
                    firstLogin: true,
                    status: 'ACTIVE'
                }
            });

            // Tạo Token truy cập
            const token = jwt.sign(
                { msisdn: user.msisdn, fullName: user.fullName, type: 'access' },
                JWT_SECRET,
                { expiresIn: '24h', issuer: 'gaming-core' }
            );

            // Tạo Magic Link để App mở WebView
            const webUrl = `${process.env.WEBGAME_URL}/?token=${token}&lang=${payload.lang || 'vi'}&game=${payload.gameType || 'DEFAULT'}&firstLogin=${user.firstLogin}`;

            return ServiceResponse.Success({
                web_url: webUrl,
                firstLogin: user.firstLogin,
                token: token
            }, "Thành công");

        } catch (error: any) {
            console.error("[AuthService] Launch Error:", error);
            return ServiceResponse.Fail("Internal Server Error");
        }
    }

    /**
     * API: Cập nhật mật khẩu (Dùng cho lần đăng nhập đầu tiên)
     */
    static async updatePassword(msisdn: string, newPass: string) {
        try {
            if (!newPass || newPass.length < 6) {
                return ServiceResponse.Fail("Mật khẩu phải có ít nhất 6 ký tự", 400);
            }

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

    /**
     * API: Đăng ký tài khoản (Luồng Web)
     */
    static async register(payload: { username: string; password: string; msisdn: string; fullName: string }) {
        try {
            // --- VALIDATION ---
            if (!payload) return ServiceResponse.Fail("Dữ liệu không hợp lệ", 400);

            const { username, password, msisdn, fullName } = payload;

            if (!username || !password || !msisdn) {
                return ServiceResponse.Fail("Vui lòng nhập đủ: Tài khoản, Mật khẩu, SĐT", 400);
            }

            // Validate SĐT
            const phoneRegex = /^[0-9]{10,12}$/;
            if (!phoneRegex.test(msisdn)) {
                return ServiceResponse.Fail("Số điện thoại không đúng định dạng", 400);
            }

            // Kiểm tra trùng lặp (Username hoặc SĐT)
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: username },
                        { msisdn: msisdn }
                    ]
                }
            });

            if (existingUser) {
                return ServiceResponse.Fail("Tài khoản hoặc số điện thoại đã tồn tại", 400);
            }

            // Tạo User mới
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
            }, "Đăng ký tài khoản thành công");

        } catch (error) {
            console.error("[AuthService] Register Error:", error);
            return ServiceResponse.Fail("Lỗi hệ thống khi đăng ký");
        }
    }

    /**
     * API: Đăng nhập (Luồng Web)
     */
    static async login(payload: { username: string; password: string }) {
        try {
            // --- VALIDATION ---
            if (!payload || !payload.username || !payload.password) {
                return ServiceResponse.Fail("Thiếu tài khoản hoặc mật khẩu", 400);
            }

            const { username, password } = payload;

            // 1. Tìm user theo username HOẶC msisdn
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: username },
                        { msisdn: username }    
                    ]
                }
            });

            // 2. Kiểm tra mật khẩu
            if (!user || !user.password) {
                return ServiceResponse.Fail("Tài khoản hoặc mật khẩu không đúng", 401);
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return ServiceResponse.Fail("Tài khoản hoặc mật khẩu không đúng", 401);
            }

            // 3. Tạo Token (Cấu trúc payload giống launchGame)
            const token = jwt.sign(
                {
                    msisdn: user.msisdn,
                    fullName: user.fullName,
                    type: 'access'
                },
                JWT_SECRET,
                { expiresIn: '24h', issuer: 'gaming-core' }
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
            return ServiceResponse.Fail("Lỗi hệ thống khi đăng nhập");
        }
    }
}