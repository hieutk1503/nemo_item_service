/* import { OrderRequest } from "../Dtos/Requests/OrderRequest";
import { OrderBuilder } from "../Mappers/OrderBuilder";
import { ServiceResponse } from "../Utils/ServiceResponse";
import { Logger } from "../Utils/Logger";
import { SocketManager } from "../Sockets/SocketManager";
import prisma from "../configs/PrismaContext"; */ // Import trực tiếp Prisma Client

/**
 * ==============================================================================
 * 📘 SAMPLE SERVICE (TEMPLATE CHUẨN - NO REPOSITORY PATTERN)
 * ==============================================================================
 * Quy tắc:
 * 1. Service gọi trực tiếp Prisma để thao tác DB.
 * 2. Return về `ServiceResponse` để Controller dễ xử lý.
 * 3. Các nghiệp vụ liên quan đến nhiều bảng (VD: Tạo đơn -> Trừ kho) BẮT BUỘC dùng Transaction.
 * ==============================================================================
 */
//export class OrderService {

    /**
     * Lấy tất cả đơn hàng
     */
    /* async getAll() {
        // Gọi thẳng Prisma
        const result = await prisma.order.findMany();
        
        // Map data sang DTO Response (nếu cần)
        const data = result.map(OrderBuilder.ToResponse);
        
        return ServiceResponse.Success(data, "Lấy danh sách thành công");
    } */

    /**
     * Lấy đơn hàng theo ID
     */
    /* async getbyid(id: number) {
        const order = await prisma.order.findUnique({
            where: { id: id }
        });

        if (!order) {
            return ServiceResponse.Fail("Không tìm thấy đơn hàng này");
        }

        return ServiceResponse.Success(OrderBuilder.ToResponse(order), "Lấy đơn hàng thành công");
    } */

    /**
     * Lấy danh sách đơn hàng của User
     */
    /* async getbyUserid(userid: number) {
        // Check User tồn tại nhanh bằng count (nhẹ hơn findUnique)
        const userCount = await prisma.user.count({ where: { id: userid } });
        
        if (userCount === 0) {
            return ServiceResponse.Fail("Người dùng không tồn tại");
        }

        const orders = await prisma.order.findMany({
            where: { userId: userid }
        });

        const data = orders.map(OrderBuilder.ToResponse);
        return ServiceResponse.Success(data, "Lấy danh sách thành công");
    } */

    /**
     * 🔥 TẠO ĐƠN HÀNG (SỬ DỤNG TRANSACTION)
     * Nghiệp vụ: 
     * 1. Kiểm tra User.
     * 2. Kiểm tra Sách & Tồn kho.
     * 3. Tạo Record Order trong DB.
     * 4. Cập nhật lại số lượng tồn kho của sách.
     */
    /* async createOder(userID: number, request: OrderRequest) {
        try {
            // 1. Validate User (Check nhanh)
            const userCount = await prisma.user.count({ where: { id: userID } });
            if (userCount === 0) {
                return ServiceResponse.Fail("Người dùng không tồn tại");
            }

            // 2. BẮT ĐẦU TRANSACTION
            // Dùng prisma.$transaction để đảm bảo tính toàn vẹn dữ liệu
            // (Nếu bước tạo đơn OK mà bước trừ kho lỗi -> Rollback tất cả)
            const newOrder = await prisma.$transaction(async (tx) => {
                
                // 2.1. Lấy thông tin sách (Sử dụng `tx` thay vì `prisma` để nằm trong transaction scope)
                const book = await tx.book.findUnique({ where: { id: request.bookID } });
                
                if (!book) {
                    throw new Error("Sách không tồn tại"); // Throw Error để kích hoạt Rollback
                }

                // 2.2. Validate tồn kho
                if (book.stock < request.quantity) {
                    throw new Error(`Tồn kho không đủ (Còn: ${book.stock})`);
                }

                // 2.3. Tính tiền
                const totalPrice = Number(book.price) * request.quantity;

                // 2.4. Tạo Order
                const createdOrder = await tx.order.create({
                    data: {
                        userId: userID,
                        bookId: request.bookID,
                        quantity: request.quantity,
                        totalPrice: totalPrice,
                        createdAt: new Date()
                    }
                });

                // 2.5. Trừ tồn kho (Quan trọng!)
                await tx.book.update({
                    where: { id: request.bookID },
                    data: { stock: book.stock - request.quantity }
                });

                return createdOrder; // Trả về kết quả transaction
            });

            // --- KẾT THÚC TRANSACTION (Nếu code chạy đến đây là DB đã lưu an toàn) ---

            // 3. Side Effects (Bắn Socket, Gửi Mail...) 
            // Nên để ngoài Transaction để không làm chậm DB
            try {
                const io = SocketManager.GetIO();
                io.to("ADMIN_ROOM").emit("NOTI_NEW_ORDER", {
                    message: `Đơn hàng mới #${newOrder.id} từ User ${userID}`,
                    data: newOrder
                });
                Logger.info("Đã bắn socket đơn hàng mới");
            } catch (socketError: any) {
                // Socket lỗi thì log lại thôi, không fail request mua hàng
                Logger.error("Lỗi bắn socket: " + socketError.message);
            }

            Logger.info(`Order Created! User: ${userID}, Book: ${request.bookID}`);
            
            return ServiceResponse.Success(OrderBuilder.ToResponse(newOrder), "Đặt hàng thành công");

        } catch (error: any) {
            // Catch tất cả lỗi (bao gồm lỗi throw trong Transaction)
            Logger.error("Lỗi tạo đơn hàng: " + error.message);
            
            // Trả về Fail kèm message lỗi
            return ServiceResponse.Fail(error.message);
        }
    }
} */