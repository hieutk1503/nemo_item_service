import prisma from "../configs/PrismaContext";
import { ServiceResponse } from "../utils/ServiceResponse";
import { Logger, PrizeActionLogger } from "../utils/Logger"; 
import { SourceType, RewardType } from "@prisma/client"; // Import Enum từ Prisma
import { LeaderboardManager } from "../manager/leaderboardManager";
import { ItemService } from "./ItemService"; // Import để dùng cho Luckybox (Single action)

// --- [HELPER] Tạo lệnh cộng đồ vào Inventory cho Transaction ---
// Hàm này không chạy DB ngay, mà trả về một Promise để nhét vào $transaction
const createInventoryOp = (userId: string, gameId: string, itemId: number, quantity: number) => {
    return prisma.inventory.upsert({
        where: {
            // Khóa unique composite trong schema.prisma: @@unique([user_id, game_id, item_reference_id])
            user_id_game_id_item_reference_id: {
                user_id: userId,
                game_id: gameId, 
                item_reference_id: itemId
            }
        },
        update: {
            quantity: { increment: quantity } // Nếu có rồi thì cộng thêm
        },
        create: {
            user_id: userId,
            game_id: gameId,
            item_reference_id: itemId,
            quantity: quantity,
            item_type: 'ITEM', // Mặc định type
            custom_data: { session_usage_count: 0 } // Init custom data
        }
    });
};

export class PrizeService {

    // LẤY INFO DISPLAY 
    async getUsersDisplayInfo(userIds: string[]) {
        try {
            return await prisma.user.findMany({
                where: { username: { in: userIds } },
                select: { username: true, msisdn: true }
            });
        } catch (error: any) {
            Logger.error("Lỗi getUsersDisplayInfo: " + error.message);
            return [];
        }
    }

    // Logic: Lưu log điểm
    async logScoreHistory(userId: string, gameId: string, seasonId: number, scorePlus: number, totalScore: number) {
        try {
            await prisma.scoreHistory.create({
                data: { userId, gameId, seasonId, scorePlus, totalScore: BigInt(totalScore) }
            });
        } catch (e: any) { 
            PrizeActionLogger.error("Lỗi lưu ScoreHistory vào DB: " + e.message, { userId, gameId, error: e }); 
        }
    }

    // Logic: Mở quà Luckybox
    async openLuckyBox(userId: string, gameId: string) {
        try {
            const configs = await prisma.luckyboxPrizeConfig.findMany({
                where: { gameId: String(gameId), isActive: true }
            });

            if (!configs.length) return ServiceResponse.Fail("Chưa có cấu hình quà");

            // Logic Random theo trọng số
            const totalWeight = configs.reduce((sum, c) => sum + c.weight, 0);
            let random = Math.random() * totalWeight;
            let selected = configs[configs.length - 1];

            for (const item of configs) {
                random -= item.weight;
                if (random <= 0) { selected = item; break; }
            }

            // 1. Lưu lịch sử nhận quà vào DB
            await prisma.rewardHistory.create({
                data: {
                    userId, gameId, sourceType: SourceType.luckybox,
                    sourceId: String(selected.id), rewardType: selected.rewardType,
                    rewardId: selected.rewardId, quantity: selected.quantity
                }
            });

            // 2. [TÍCH HỢP] Trao quà về Inventory ngay lập tức
            if (selected.rewardType === RewardType.Items) {
                try {
                    // Ép kiểu rewardId (String) sang Int cho ItemId
                    const itemId = Number(selected.rewardId);
                    if (!isNaN(itemId)) {
                        await ItemService.grantItem(
                            userId, 
                            gameId, 
                            itemId, 
                            selected.quantity, 
                            "LUCKYBOX"
                        );
                    } else {
                        Logger.error(`Luckybox Config Error: RewardID '${selected.rewardId}' không phải là số!`);
                    }
                } catch (err: any) {
                    // Chỉ log lỗi, không throw để user vẫn nhận được thông báo trúng (xử lý bù sau)
                    Logger.error(`Lỗi trao item Luckybox vào Inventory: ${err.message}`);
                }
            }

            // 3. LOG ACTION
            PrizeActionLogger.info(`User ${userId} mở Luckybox trúng ${selected.quantity} ${selected.rewardId}`, {
                action: "OPEN_LUCKYBOX", userId, gameId,
                rewardId: selected.rewardId, quantity: selected.quantity, rewardType: selected.rewardType
            });

            return ServiceResponse.Success({
                rewardType: selected.rewardType,
                rewardId: selected.rewardId,
                quantity: selected.quantity
            }, "Mở quà thành công");

        } catch (e: any) {
            PrizeActionLogger.error("Luckybox Error: " + e.message, { userId, gameId, stack: e.stack });
            return ServiceResponse.Fail("Lỗi hệ thống");
        }
    }

    // Lấy lịch sử 
    async getHistory(userId: string, gameId: string, type: string, page: number, limit: number) {
        try {
            const skip = (page - 1) * limit;
            let rewards: any[] = [];
            let scores: any[] = [];

            if (type === 'reward') {
                rewards = await prisma.rewardHistory.findMany({
                    where: { userId, gameId }, orderBy: { createdAt: 'desc' }, skip, take: limit
                });
            } else if (type === 'score') {
                const rawScores = await prisma.scoreHistory.findMany({
                    where: { userId, gameId }, orderBy: { createdAt: 'desc' }, skip, take: limit
                });
                scores = rawScores.map(s => ({ ...s, totalScore: s.totalScore.toString() }));
            }

            return ServiceResponse.Success({ type, page, rewards, scores }, "Lấy lịch sử thành công");
        } catch (e: any) { 
            Logger.error("Lỗi getHistory: " + e.message);
            return ServiceResponse.Fail("Lỗi lấy lịch sử"); 
        }
    }

    
    // CHỐT SỔ MÙA GIẢI
    async finalizeSeason(gameId: string, seasonId: number) {
        try {
            PrizeActionLogger.info(`Bắt đầu xử lý chốt sổ game ${gameId} mùa ${seasonId}`, {
                action: "START_FINALIZE_SEASON", gameId, seasonId
            });

            // 1. Lấy dữ liệu Redis
            const redisUsers = await LeaderboardManager.getAllScores(gameId, seasonId);
            if (redisUsers.length === 0) {
                return { success: false, message: "Không có dữ liệu để chốt" };
            }

            // 2. Lấy Config & User Info
            const prizeConfigs = await prisma.leaderboardPrizeConfig.findMany({
                where: { gameId: gameId, isActive: true }
            });

            const userIds = redisUsers.map(u => u.value);
            const userInfos = await prisma.user.findMany({
                where: { username: { in: userIds } },
                select: { username: true } 
            });

            // --- CHUẨN BỊ MẢNG TRANSACTION ---
            // Thay vì chạy từng lệnh, ta gom tất cả vào mảng này
            const transactionOps: any[] = [];

            const snapshots = [];
            const rewardHistories = [];
            let countRewarded = 0;

            for (let i = 0; i < redisUsers.length; i++) {
                const item = redisUsers[i];
                const rank = i + 1;
                const userId = item.value;
                const score = item.score;
                
                const userInfo = userInfos.find(u => u.username === userId);
                const userNameDisplay = userInfo ?.username ?? userId;

                // Tìm quà theo rank
                const config = prizeConfigs.find(c => rank >= c.rankFrom && rank <= c.rankTo);

                if (config) {
                    // a. Tạo History Record
                    rewardHistories.push({
                        userId: userId,
                        gameId: gameId,
                        sourceType: SourceType.leaderboard,
                        sourceId: seasonId.toString(),
                        rewardType: config.rewardType,
                        rewardId: config.rewardId,
                        quantity: config.quantity
                    });

                    // b. [TÍCH HỢP] Tạo lệnh cộng đồ Inventory (NẾU LÀ ITEMS)
                    if (config.rewardType === RewardType.Items) {
                        const itemId = Number(config.rewardId);
                        if (!isNaN(itemId)) {
                            // Gọi helper để tạo lệnh Upsert và đẩy vào hàng đợi transaction
                            const invOp = createInventoryOp(userId, gameId, itemId, config.quantity);
                            transactionOps.push(invOp);
                        } else {
                            Logger.error(`Finalize Error: RewardID '${config.rewardId}' ở rank ${rank} không phải số!`);
                        }
                    }

                    countRewarded++;

                    // Log file (Không ảnh hưởng transaction)
                    PrizeActionLogger.info(`Trao quà Top ${rank} cho user ${userId}`, {
                        action: "REWARD_GIVEN", userId, gameId, rank, reward: `${config.quantity} ${config.rewardId}`
                    });
                }

                // c. Tạo Snapshot Record
                snapshots.push({
                    gameId: gameId,
                    seasonId: seasonId,
                    userId: userId,
                    userName: userNameDisplay,
                    totalScore: BigInt(score), 
                    rankScore: rank,
                    createdAt: new Date()
                });
            }

            // 3. Đẩy các lệnh CreateMany vào transactionOps
            // Lưu ý: createMany nhẹ hơn loop create từng cái
            if (snapshots.length > 0) {
                transactionOps.push(prisma.leaderboardSnapshot.createMany({ data: snapshots }));
            }
            if (rewardHistories.length > 0) {
                transactionOps.push(prisma.rewardHistory.createMany({ data: rewardHistories }));
            }

            // 4. [THỰC THI] Chạy tất cả (Snapshot + History + Inventory Upserts) trong 1 Transaction
            if (transactionOps.length > 0) {
                await prisma.$transaction(transactionOps);
            }

            PrizeActionLogger.info(`Chốt sổ hoàn tất game ${gameId}`, {
                action: "FINALIZE_SUCCESS", gameId, seasonId,
                totalSnapshots: snapshots.length, totalRewarded: countRewarded
            });

            return { 
                success: true, 
                message: `Chốt sổ thành công! Lưu ${snapshots.length} user. Trao thưởng cho ${countRewarded} user.` 
            };

        } catch (error: any) {
            PrizeActionLogger.error("Lỗi finalizeSeason: " + error.message, { gameId, seasonId, stack: error.stack });
            return { success: false, message: error.message };
        }
    }
}