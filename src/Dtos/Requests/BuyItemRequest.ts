import { IsNotEmpty } from 'class-validator';

export class BuyItemRequest {
    // Kiểm tra gameId không được rỗng
    @IsNotEmpty({ message: "Game ID là bắt buộc" })
    gameId: any; 

    // Kiểm tra productId không được rỗng
    @IsNotEmpty({ message: "Product ID là bắt buộc" })
    productId: any;
}