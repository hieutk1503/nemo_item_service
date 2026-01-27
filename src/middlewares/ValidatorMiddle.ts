import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

/**
 * Middleware Validator: Kiểm tra tính hợp lệ của Request Body dựa trên DTO
 * @param dtoClass Class DTO cần kiểm tra (ví dụ: GrantItemRequest)
 */
export const ValidatorMiddle = (dtoClass: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // 1. Chuyển đổi JSON Body sang Instance của Class DTO
        const output = plainToInstance(dtoClass, req.body);

        // 2. Thực hiện Validate
        const errors: ValidationError[] = await validate(output, {
            whitelist: true,            // Tự động xóa các trường thừa không khai báo trong DTO
            forbidNonWhitelisted: true,  // Báo lỗi nếu có trường lạ gửi lên
        });

        // 3. Xử lý kết quả trả về
        if (errors.length > 0) {
            // Gom tất cả các lỗi thành một chuỗi tin nhắn duy nhất
            const rawErrors = errors.map((error: ValidationError) => 
                Object.values(error.constraints || {}).join(', ')
            ).join('; ');

            return res.status(HttpStatusCode.BAD_REQUEST).json(
                APIResponse.BadRequest(`Dữ liệu không hợp lệ: ${rawErrors}`)
            );
        }

        // Nếu hợp lệ, gán ngược lại dữ liệu đã được lọc vào req.body và đi tiếp
        req.body = output;
        next();
    };
};