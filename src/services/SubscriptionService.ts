import prisma from '../configs/PrismaContext';
import { ServiceResponse } from '../utils/ServiceResponse';
import { CoreGateway } from '../gateways/CoreGateway';

export class SubscriptionService {

  /**
   * Bước 1: Khởi tạo giao dịch mua gói
   */
  static async initiatePurchase(msisdn: string, planId: number) {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: { benefits: true, game: true }
      });

      if (!plan) return ServiceResponse.Fail("Plan not found");

      const coinBenefit = plan.benefits.find(b => b.benefit_type === 'GOLD') || plan.benefits[0];

      const gwResult = await CoreGateway.initSubscription({
        msisdn: msisdn,
        packageCode: plan.packageCode,
        packageName: plan.name,
        amount: Number(plan.price),
        cycle: plan.duration_days,
        coinAmount: coinBenefit ? coinBenefit.quantity : 0,
        coinUnit: coinBenefit ? coinBenefit.benefit_type : "GOLD"
      });

      await prisma.transaction.create({
        data: {
          refId: gwResult.generatedRefId,
          msisdn: msisdn,
          gameCode: plan.game.code,
          action: "REGISTER",
          amount: plan.price,
          status: 2, // 2 = Pending
          payload: JSON.stringify(gwResult.data)
        }
      });

      return ServiceResponse.Success({ refId: gwResult.generatedRefId }, "Thành công");

    } catch (error) {
      console.error("[SubService] Init Error:", error);
      return ServiceResponse.Fail("Failed to initiate purchase");
    }
  }

  /**
   * Bước 2: Xác nhận OTP từ người dùng
   */
  static async confirmOTP(payload: any) {
    try {
      // 1. Gọi sang nhà mạng để xác thực mã OTP
      const gwResult = await CoreGateway.confirmSubscription(payload);

      if (gwResult.success) {
        // 2. Nếu OTP đúng, chủ động cập nhật trạng thái Transaction lên Thành công ngay
        await prisma.transaction.update({
          where: { refId: payload.refId },
          data: { status: 1 } // 1 = Success
        });
        
        return ServiceResponse.Success(gwResult.data, "Xác nhận OTP thành công");
      }

      return ServiceResponse.Fail(gwResult.message || "Xác nhận OTP thất bại", 400);
    } catch (error) {
      console.error("[SubService] Confirm OTP Error:", error);
      return ServiceResponse.Fail("Lỗi hệ thống khi xác nhận OTP");
    }
  }

  /**
   * Bước 3: Xử lý Callback từ CoreGW (Chốt hạ ngày hạn VIP)
   */
  static async handleCallback(payload: { refId: string; msisdn: string; success: boolean; message: string }) {
    const trans = await prisma.transaction.findUnique({ where: { refId: payload.refId } });
    
    if (!trans) {
      console.warn(`[SubService] Callback received for unknown RefID: ${payload.refId}`);
      return ServiceResponse.Fail("Transaction not found");
    }

    if (!payload.success) {
      await prisma.transaction.update({
        where: { id: trans.id },
        data: { status: 0, payload: JSON.stringify(payload) }
      });
      return ServiceResponse.Success(null, "Processed Failed Callback");
    }

    try {
      await prisma.$transaction(async (tx) => {
        const finalAction = "REGISTER";

        await tx.transaction.update({
          where: { id: trans.id },
          data: { status: 1, action: finalAction }
        });

        const plan = await tx.plan.findFirst({
           where: { 
             game: { code: trans.gameCode },
             price: trans.amount || 0 
           }
        });

        if (plan) {
            const existingSub = await tx.subscription.findFirst({
                where: { userId: payload.msisdn, planId: plan.id }
            });

            let newEndDate = new Date();
            if (existingSub && existingSub.endDate && existingSub.endDate > new Date()) {
                newEndDate = new Date(existingSub.endDate);
            }
            newEndDate.setDate(newEndDate.getDate() + plan.duration_days);

            await tx.subscription.upsert({
                where: { id: existingSub?.id || 0 },
                create: {
                    userId: payload.msisdn,
                    planId: plan.id,
                    status: 1,
                    startDate: new Date(),
                    endDate: newEndDate,
                    refId: payload.refId
                },
                update: {
                    status: 1,
                    endDate: newEndDate,
                    refId: payload.refId
                }
            });
        }
      });

      return ServiceResponse.Success(null, "Callback Processed Successfully");

    } catch (error) {
      console.error("[SubService] Transaction Error:", error);
      return ServiceResponse.Fail("Callback Processing Error");
    }
  }
}