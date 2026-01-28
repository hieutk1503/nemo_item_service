import prisma from '../configs/PrismaContext';
import { ServiceResponse } from '../utils/ServiceResponse';
import { CoreGateway } from '../gateways/CoreGateway';

export class SubscriptionService {

  /**
   * Bước 1: Client bấm mua -> Server gọi Init sang CoreGW
   */
  static async initiatePurchase(msisdn: string, planId: number) {
    try {
      // 1. Validate gói cước & Game
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: { benefits: true, game: true }
      });

      if (!plan) return ServiceResponse.Fail("Plan not found");

      // 2. Lấy Benefit đầu tiên làm Coin
      const coinBenefit = plan.benefits.find(b => b.benefit_type === 'GOLD') || plan.benefits[0];

      // 3. Gọi Gateway
      const gwResult = await CoreGateway.initSubscription({
        msisdn: msisdn,
        packageCode: plan.packageCode,
        packageName: plan.name,
        amount: Number(plan.price),
        cycle: plan.duration_days,
        coinAmount: coinBenefit ? coinBenefit.quantity : 0,
        coinUnit: coinBenefit ? coinBenefit.benefit_type : "GOLD"
      });

      // 4. Tạo Transaction Log
      await prisma.transaction.create({
        data: {
          refId: gwResult.generatedRefId,
          msisdn: msisdn,
          gameCode: plan.game.code,
          action: "REGISTER",
          amount: plan.price,
          status: 2,
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
   * Bước 3: Xử lý Callback từ CoreGW (Quan trọng nhất)
   */
  static async handleCallback(payload: { refId: string; msisdn: string; success: boolean; message: string }) {
    // Tìm Transaction gốc
    const trans = await prisma.transaction.findUnique({ where: { refId: payload.refId } });
    
    if (!trans) {
      console.warn(`[SubService] Callback received for unknown RefID: ${payload.refId}`);
      return ServiceResponse.Fail("Transaction not found");
    }

    // Nếu CoreGW báo thất bại
    if (!payload.success) {
      await prisma.transaction.update({
        where: { id: trans.id },
        data: { status: 0, payload: JSON.stringify(payload) }
      });
      return ServiceResponse.Success(null, "Processed Failed Callback");
    }

    // Nếu Thành công -> Xử lý Transaction DB (ACID)
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