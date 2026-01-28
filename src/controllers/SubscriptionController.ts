import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { CoreGateway } from '../gateways/CoreGateway';
import { Logger } from '../utils/Logger';

export class SubscriptionController {
    
    // API: Mua gói
    public async purchase(req: Request, res: Response) {
        try {
            const { msisdn, planId } = req.body;
            const result = await SubscriptionService.initiatePurchase(msisdn, Number(planId));
            return res.status(result.statusCode).json(result);
        } catch (e) {
            return res.status(500).json({ success: false });
        }
    }

    // API: Xác nhận OTP
    public async confirm(req: Request, res: Response) {
        try {
            const data = await CoreGateway.confirmSubscription(req.body);
            return res.json({ success: true, data });
        } catch (e) {
            return res.status(500).json({ success: false });
        }
    }

    // API: Callback từ CoreGW
    public async handleCallback(req: Request, res: Response) {
        try {
            const result = await SubscriptionService.handleCallback(req.body);
            return res.status(200).json(result);
        } catch (e) {
            return res.status(200).json({ success: false }); // Vẫn trả 200 để tránh retry
        }
    }
}