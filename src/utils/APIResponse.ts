// Định nghĩa Enum cho dễ quản lý, đỡ phải nhớ số 200, 400...
export enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500
}

export class APIResponse<T> {
    status: number; // Đổi sang number cho chuẩn chuẩn HTTP
    success: boolean;
    message: string;
    data?: T;

    constructor(status: number, success: boolean, message: string, data?: T) {
        this.status = status;
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // --- SUCCESS RESPONSES ---

    // 200: Thành công (GET, PUT, DELETE...)
    static OK<T>(message: string, data?: T): APIResponse<T> {
        return new APIResponse(HttpStatusCode.OK, true, message, data);
    }

    // 201: Tạo mới thành công (POST create)
    static Created<T>(message: string, data?: T): APIResponse<T> {
        return new APIResponse(HttpStatusCode.CREATED, true, message, data);
    }

    // --- ERROR RESPONSES ---

    // 400: Lỗi do client gửi lên (Validate sai, thiếu field...)
    static BadRequest<T>(message: string): APIResponse<T> {
        return new APIResponse(HttpStatusCode.BAD_REQUEST, false, message);
    }

    // 401: Chưa đăng nhập hoặc Token hết hạn
    static Unauthorized<T>(message: string = "Unauthorized"): APIResponse<T> {
        return new APIResponse(HttpStatusCode.UNAUTHORIZED, false, message);
    }

    // 403: Đã đăng nhập nhưng không có quyền (Vd: User thường đòi xóa Admin)
    static Forbidden<T>(message: string = "Access Denied"): APIResponse<T> {
        return new APIResponse(HttpStatusCode.FORBIDDEN, false, message);
    }

    // 404: Không tìm thấy dữ liệu
    static NotFound<T>(message: string = "Resource Not Found"): APIResponse<T> {
        return new APIResponse(HttpStatusCode.NOT_FOUND, false, message);
    }

    // 500: Lỗi hệ thống (Code crash, DB chết...)
    static ServerError<T>(message: string = "Internal Server Error"): APIResponse<T> {
        return new APIResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, false, message);
    }
    
    // Hàm Fail custom code (dùng cho trường hợp đặc biệt khác)
    static Fail<T>(message: string, code: number = HttpStatusCode.INTERNAL_SERVER_ERROR): APIResponse<T> {
        return new APIResponse(code, false, message);
    }

    // chú ý status header phải khớp với status body.
}