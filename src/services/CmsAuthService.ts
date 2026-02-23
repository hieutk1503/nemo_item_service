import prisma from '../configs/PrismaContext';
import * as bcrypt from 'bcrypt';
import { ServiceResponse } from '../utils/ServiceResponse';
import { generateAccessToken } from '../utils/JwtUtil';

export class CmsAuthService {

    /**
     * Xử lý Đăng nhập CMS
     */
    static async login(payload: { username: string; password: string }) {
        try {
            const { username, password } = payload;

            // 1. Tìm Admin
            const admin = await prisma.admin.findUnique({ where: { username } });
            if (!admin) return ServiceResponse.Fail("Tài khoản không tồn tại", 401);

            // 2. Check Password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) return ServiceResponse.Fail("Sai mật khẩu", 401);

            // 3. Check Status
            if (admin.status !== 'ACTIVE') return ServiceResponse.Fail("Tài khoản đã bị khóa", 403);

            // 4. Tạo Token (Quan trọng: Gắn Role vào để Middleware check)
            const token = generateAccessToken(
                `ADMIN_${admin.id}`, // msisdn giả (vì admin ko có sđt)
                admin.username,
                admin.fullName,
                'CMS_SYSTEM',        // GameType định danh là CMS
                { 
                    role: admin.role,
                    adminId: admin.id 
                } 
            );

            return ServiceResponse.Success({
                token,
                role: admin.role,
                fullName: admin.fullName
            }, "Đăng nhập thành công");

        } catch (error) {
            console.error("CMS Login Error:", error);
            return ServiceResponse.Fail("Lỗi hệ thống", 500);
        }
    }

    /**
     * Lấy thông tin Profile (Phục vụ Vben Admin hiển thị)
     */
    static async getProfile(adminId: number) {
        try {
            const admin = await prisma.admin.findUnique({ where: { id: adminId } });
            if (!admin) return ServiceResponse.Fail("Không tìm thấy Admin", 404);

            // Cấu trúc trả về chuẩn cho Vben
            return ServiceResponse.Success({
                userId: admin.id,
                username: admin.username,
                realName: admin.fullName,
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=190848757&s=640', // Avatar giả
                desc: 'Manager',
                // [QUAN TRỌNG]: Vben yêu cầu mảng roles ['SUPER_ADMIN']
                roles: [admin.role], 
            });
        } catch (error) {
            return ServiceResponse.Fail("Lỗi lấy thông tin");
        }
    }
}