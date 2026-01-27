import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator';

/**
 * LƯU Ý: userId và gameType đã được chuyển lên Header (x-user-id, x-game-id)
 * nên chúng ta xóa khỏi các class DTO dưới đây.
 */

// 1. DTO cho API Trao vật phẩm (Grant Item)
export class GrantItemRequest {
    @IsNotEmpty({ message: 'Item ID không được để trống' })
    @IsNumber()
    itemId!: number;

    @IsOptional() 
    @IsNumber()
    @Min(1, { message: 'Số lượng phải lớn hơn 0' })
    quantity!: number;

    @IsNotEmpty({ message: 'Nguồn (Source) không được để trống' })
    @IsString()
    source!: string;
}

// 2. DTO cho API Sử dụng vật phẩm (Use Item)
export class UseItemRequest {
    @IsNotEmpty({ message: 'Item ID là bắt buộc' })
    @IsNumber()
    itemId!: number;

    @IsNotEmpty({ message: 'Session ID là bắt buộc để tính giới hạn lượt chơi' })
    @IsString()
    sessionId!: string;
}

// 3. DTO cho API Kiểm tra sở hữu (Check Ownership)
// Nếu bạn lấy itemId từ URL (params) thì có thể không cần DTO này.
// Nếu lấy từ Body thì giữ lại itemId.
export class CheckOwnershipRequest {
    @IsNotEmpty()
    @IsNumber()
    itemId!: number;
}

// 4. DTO cho API Thu hồi vật phẩm (Revoke Item)
export class RevokeItemRequest {
    @IsNotEmpty()
    @IsNumber()
    itemId!: number;

    @IsNotEmpty({ message: 'Cần nhập lý do thu hồi để lưu log' })
    @IsString()
    reason!: string;
}