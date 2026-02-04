import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { Logger } from '../utils/Logger';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

export class SubscriptionController {
    
    /**
     * API: Mua gói (POST)
     * Path: /api/client/purchase
     */
    purchase = async (req: any, res: Response) => { 
        try {
            const msisdn = req.user.msisdn; 
            const { planId } = req.body;

            if (!planId) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thiếu planId"));
            }
            
            const result = await SubscriptionService.initiatePurchase(msisdn, Number(planId));
            return res.status(result.statusCode || HttpStatusCode.OK).json(result);
        } catch (e: any) {
            Logger.error('PURCHASE_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError("Internal Error"));
        }
    }

    /**
     * API: Xác nhận OTP (POST)
     * Path: /api/client/confirm
     */
    confirm = async (req: Request, res: Response) => {
        try {
            const result = await SubscriptionService.confirmOTP(req.body);
            return res.status(result.statusCode || HttpStatusCode.OK).json(result);
        } catch (e: any) {
            Logger.error('CONFIRM_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError("Xác nhận thất bại"));
        }
    }

    /**
     * API: Callback từ CoreGW (POST)
     * Path: /api/subscription/result
     */
    handleCallback = async (req: Request, res: Response) => {
        try {
            const result = await SubscriptionService.handleCallback(req.body);
            return res.status(HttpStatusCode.OK).json(result);
        } catch (e: any) {
            Logger.error('CALLBACK_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.OK).json({ success: false, message: "Error logged" }); 
        }
    }

    /**
     * API: Lấy danh sách gói cước (GET)
     * Path: /api/client/plans
     */
    getPlans = async (req: Request, res: Response) => {
        try {
            const result = await SubscriptionService.getPlans();
            return res.status(HttpStatusCode.OK).json(result);
        } catch (e: any) {
            Logger.error('GET_PLANS_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError("Lỗi lấy danh sách gói"));
        }
    }

    /**
     * API: Lấy lịch sử giao dịch cá nhân (GET)
     * Path: /api/client/me/transactions
     */
    getTransactions = async (req: any, res: Response) => {
        try {
            // Lấy msisdn từ authMiddleware
            const msisdn = req.user.msisdn;
            const result = await SubscriptionService.getMyTransactions(msisdn);
            return res.status(HttpStatusCode.OK).json(result);
        } catch (e: any) {
            Logger.error('GET_TRANSACTIONS_CONTROLLER_ERR', e.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError("Lỗi lấy lịch sử giao dịch"));
        }
    }
}