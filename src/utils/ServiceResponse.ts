export class ServiceResponse<T>{
    success: boolean;
    message: string;
    data?: T;
    statusCode: number;

    constructor(success: boolean, message: string, data?: T, statusCode: number = 200) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }

    /**
     * Trả về kết quả thành công
     * @param data Dữ liệu trả về
     * @param message Thông báo (mặc định là "Thành công")
     */
    static Success<T>(data: T, message: string): ServiceResponse<T> {
        return new ServiceResponse(true, message, data, 200);
    }

    /**
     * Trả về kết quả thất bại
     * @param message Thông báo lỗi
     */
    static Fail<T>(message: string, statusCode: number = 500): ServiceResponse<T> {
        return new ServiceResponse(false, message, undefined, statusCode) as any;
    }
}