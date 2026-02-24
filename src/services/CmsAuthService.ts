import prisma from '../configs/PrismaContext';
import * as bcrypt from 'bcrypt';
import { ServiceResponse } from '../utils/ServiceResponse';
import { generateAccessToken } from '../utils/JwtUtil';

export class CmsAuthService {
    static async login(payload: { username: string; password: string }) {
        try {
            const { username, password } = payload;

            // Lấy Admin kèm Role và Permission
            const admin = await prisma.admin.findUnique({
                where: { username },
                include: {
                    role: {
                        include: { permissions: true }
                    }
                }
            });

            if (!admin) return ServiceResponse.Fail("Tài khoản không tồn tại", 401);

            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) return ServiceResponse.Fail("Sai mật khẩu", 401);

            if (admin.status !== 'ACTIVE') return ServiceResponse.Fail("Tài khoản bị khóa", 403);

            // Ép kiểu (p: any) tạm thời để TS không báo lỗi đỏ nếu ông chưa chạy prisma generate
            const permissionList = admin.role.permissions.map((p: any) => p.permissionCode);

            const token = generateAccessToken(
                `ADMIN_${admin.id}`,
                admin.username,
                admin.fullName || "Admin",
                'CMS_SYSTEM', // Đánh dấu token của CMS
                { 
                    role: admin.role.name, 
                    adminId: admin.id 
                }
            );

            return ServiceResponse.Success({
                token,
                role: admin.role.name,
                fullName: admin.fullName,
                permissions: permissionList
            }, "Đăng nhập thành công");

        } catch (error) {
            console.error("CMS Login Error:", error);
            return ServiceResponse.Fail("Lỗi hệ thống", 500);
        }
    }

    static async getProfile(adminId: number) {
        try {
            const admin = await prisma.admin.findUnique({ 
                where: { id: adminId },
                include: {
                    role: {
                        include: { permissions: true }
                    }
                }
            });

            if (!admin) return ServiceResponse.Fail("Không tìm thấy Admin", 404);

            const permissionList = admin.role.permissions.map((p: any) => p.permissionCode);

            const data = {
                userId: admin.id,
                username: admin.username,
                realName: admin.fullName || "Admin",
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=190848757&s=640',
                desc: admin.role.description,
                roles: [admin.role.name],      
                permissions: permissionList    
            };

            return ServiceResponse.Success(data, "Lấy thông tin thành công");
            
        } catch (error) {
            console.error("Get Profile Error:", error);
            return ServiceResponse.Fail("Lỗi lấy thông tin");
        }
    }
}