/* import { Request, Response } from "express";
import { OrderService } from "../Services/OrderService";
import { Logger } from "../Utils/Logger";
// Import cả Class và Enum từ file Utils
import { APIResponse, HttpStatusCode } from "../Utils/APIResponse"; */

/**
 * ==============================================================================
 * 📘 ORDER CONTROLLER (TEMPLATE STANDARD)
 * ==============================================================================
 * Quy tắc trả về Response:
 * 1. Luôn sử dụng Enum `HttpStatusCode` cho res.status(), KHÔNG hardcode số (200, 400...).
 * 2. Hàm trong `APIResponse` phải tương ứng với status code:
 * - 200 OK -> APIResponse.OK()
 * - 201 Created -> APIResponse.Created()
 * - 400 Bad Request -> APIResponse.BadRequest()
 * - 404 Not Found -> APIResponse.NotFound()
 * - 500 Server Error -> APIResponse.ServerError()
 * ==============================================================================
 */
//export class OrderController {
    
    //private readonly _service = new OrderService();

    /**
     * API: Tạo đơn hàng mới
     * Method: POST
     * Status thành công: 201 Created
     */
    /* createorder = async (req: Request, res: Response) => {
        try {
            const request = req.body;
            // Ép kiểu user từ middleware (nếu có)
            const user = (req as any).user;
            
            // Gọi Service xử lý nghiệp vụ
            const result = await this._service.createOder(user.userID, request);
            
            // [CASE 1] Lỗi nghiệp vụ (Business Logic Error)
            // Ví dụ: Hết hàng, sai logic, validation fail từ service...
            if (!result.success) {
                Logger.error("Lỗi nghiệp vụ khi tạo đơn: " + result.message);
                
                // Trả về 400 Bad Request
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            // [CASE 2] Thành công
            // Với hành động tạo mới (POST), trả về 201 Created chuẩn RESTful
            Logger.info("Mua hàng thành công");
            
            return res.status(HttpStatusCode.CREATED)
                      .json(APIResponse.Created(result.message, result.data));
        }
        catch (error: any) {
            // [CASE 3] Lỗi hệ thống (Crash, Exception)
            Logger.error(`System Error in createorder: ${error.message}`);

            // Trả về 500 Internal Server Error
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Có lỗi hệ thống: " + error.message));
        }
    } */

    /**
     * API: Lấy danh sách tất cả đơn hàng
     * Method: GET
     * Status thành công: 200 OK
     */
    /* getallorders = async (req: Request, res: Response) => {
        try {
            const data = await this._service.getAll();
            
            Logger.info("Lấy danh sách đơn hàng thành công");
            
            // Trả về 200 OK
            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Lấy danh sách đơn hàng thành công", data));
        }
        catch (error: any) {
            Logger.error(`System Error in getallorders: ${error.message}`);
            
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Có lỗi xảy ra: " + error.message));
        }
    } */

    /**
     * API: Lấy chi tiết đơn hàng theo ID
     * Method: GET
     */
    /* getorderbyid = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);

            // Validate đầu vào
            if (isNaN(id)) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("ID không hợp lệ (Phải là số)"));
            }

            const data = await this._service.getbyid(id);

            // Kiểm tra kết quả từ Service
            if (!data.success) {
                Logger.error(`Lỗi khi lấy đơn hàng theo ID: ` + data.message);
                
                // Nếu không tìm thấy hoặc lỗi logic -> Trả về 400 (hoặc 404 nếu muốn cụ thể hơn)
                // Ở đây dùng BadRequest theo logic cũ của dự án
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(data.message));
            }

            Logger.info(data.message);
            
            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(data.message, data));
        }
        catch (error: any) {
            Logger.error(`System Error in getorderbyid: ${error.message}`);
            
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Có lỗi xảy ra: " + error.message));
        }
    } */

    /**
     * API: Lấy đơn hàng theo User ID
     * Method: GET
     */
    /* getorderbyuserid = async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.userId);
            
            if (isNaN(userId)) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("User ID không hợp lệ"));
            }

            const data = await this._service.getbyUserid(userId);

            if (!data.success) {
                Logger.error(`Lỗi khi lấy đơn hàng theo UserID: ` + data.message);
                
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(data.message));
            }

            Logger.info(data.message);
            
            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(data.message, data));
        }
        catch (error: any) {
            Logger.error(`System Error in getorderbyuserid: ${error.message}`);
            
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Có lỗi xảy ra: " + error.message));
        }
    }
} */