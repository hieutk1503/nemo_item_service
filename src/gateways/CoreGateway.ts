import axios from 'axios';
import moment from 'moment';

const CORE_GW_URL = process.env.CORE_GW_URL;

interface InitSubscriptionPayload {
  msisdn: string;
  packageCode: string;
  packageName: string;
  amount: number;
  cycle: number;
  coinAmount: number;
  coinUnit: string;
}

export class CoreGateway {
  
  /**
   * Gọi API Init Subscription
   */
  static async initSubscription(payload: InitSubscriptionPayload) {
    try {
      const now = moment();
      const expire = moment().add(payload.cycle, 'days');
      const refId = `MB_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const body = {
        msisdn: payload.msisdn,
        packageCode: payload.packageCode,
        currency: "KHR",
        amount: payload.amount,
        creatDate: now.format("DD-MM-YYYY HH:mm:ss"),
        expirationDate: expire.format("DD-MM-YYYY HH:mm:ss"),
        isFree: payload.amount === 0 ? 1 : 0,
        refId: refId,
        cycle: payload.cycle,
        packageName: payload.packageName,
        coinAmount: payload.coinAmount,
        coinUnit: payload.coinUnit
      };

      console.log(`[CoreGateway] Request Init:`, body);
      
      // Gọi Axios
      const response = await axios.post(`${CORE_GW_URL}/api/subscription/init`, body);
      
      console.log(`[CoreGateway] Response Init:`, response.data);

      // Trả về kèm refId do mình tự sinh để lưu vào DB
      return { 
        success: true, 
        data: response.data, 
        generatedRefId: refId 
      };

    } catch (error: any) {
      console.error(`[CoreGateway] Error Init:`, error.response?.data || error.message);
      throw new Error("CoreGW Connection Failed");
    }
  }

  /**
   * Gọi API Confirm OTP
   */
  static async confirmSubscription(data: { msisdn: string, packageCode: string, refId: string, otp: string }) {
    try {
      const response = await axios.post(`${CORE_GW_URL}/api/subscription/confirm`, data);
      return response.data;
    } catch (error: any) {
      console.error(`[CoreGateway] Error Confirm:`, error.message);
      throw error;
    }
  }
}