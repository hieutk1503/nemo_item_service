import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { Logger } from '../utils/Logger';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

export class SubscriptionController {
    
    // API: Mua gói
    purchase = async (req: Request, res: Response) => {
        try {
            const { msisdn, planId } = req.body;
            if (!msisdn || !planId) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thiếu dữ liệu"));
            }
            const result = await SubscriptionService.initiatePurchase(msisdn, Number(planId));
            return res.status(result.statusCode).json(result);
        } catch (e: any) {
            Logger.error('PURCHASE_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError("Internal Error"));
        }
    }

    // API: Xác nhận OTP - Đã đưa qua Service
    confirm = async (req: Request, res: Response) => {
        try {
            const result = await SubscriptionService.confirmOTP(req.body);
            return res.status(result.statusCode).json(result);
        } catch (e: any) {
            Logger.error('CONFIRM_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError("Xác nhận thất bại"));
        }
    }

    // API: Callback từ CoreGW
    handleCallback = async (req: Request, res: Response) => {
        try {
            const result = await SubscriptionService.handleCallback(req.body);
            return res.status(HttpStatusCode.OK).json(result);
        } catch (e: any) {
            Logger.error('CALLBACK_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.OK).json({ success: false, message: "Error logged" }); 
        }
    }
}