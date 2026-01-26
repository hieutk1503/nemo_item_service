import prisma from "../configs/PrismaContext";
import { ServiceResponse } from "../utils/ServiceResponse";
import { Logger, PrizeActionLogger } from "../utils/Logger"; 
import { SourceType } from "@prisma/client";
import { LeaderboardManager } from "../manager/leaderboardManager";

// --- [MOCK CONFIG] ĐỊNH NGHĨA INTERFACE TẠM ---
interface UserDisplayInfo {
    username: string;
    msisdn: string;
}

export class PrizeService {

    // // LẤY INFO DISPLAY 
    // async getUsersDisplayInfo(userIds: string[]) {
    //     try {
    //         return await prisma.user.findMany({
    //             where: { 
    //                 username: { in: userIds } 
    //             },
    //             select: { 
    //                 username: true,
    //                 msisdn: true 
    //             }
    //         });
    //     } catch (error: any) {
    //         Logger.error("Lỗi getUsersDisplayInfo: " + error.message);
    //         return [];
    //     }
    // }

    //[MOCK DATA] LẤY THÔNG TIN USER
    async getUsersDisplayInfo(userIds: string[]): Promise<UserDisplayInfo[]> {
        try {
            // --- BẮT ĐẦU ĐOẠN MOCK DATA ---
            // Tạo ra danh sách user giả dựa trên danh sách ID truyền vào
            const mockUsers = userIds.map((id, index) => {
                // Tạo số điện thoại giả: 098xxxxxxx
                // index giúp số điện thoại mỗi người khác nhau một chút
                const fakePhone = `098${String(index).padStart(7, '1')}`; 
                
                return {
                    username: id,
                    msisdn: fakePhone // Trả về số giả để test che số
                };
            });

            // Giả lập độ trễ mạng (50ms) cho giống thật
            await new Promise(resolve => setTimeout(resolve, 50));

            return mockUsers;
           

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

            // Logic Random theo trọng số (Weighted Random)
            const totalWeight = configs.reduce((sum, c) => sum + c.weight, 0);
            let random = Math.random() * totalWeight;
            let selected = configs[configs.length - 1];

            for (const item of configs) {
                random -= item.weight;
                if (random <= 0) { selected = item; break; }
            }

            // Lưu lịch sử nhận quà vào DB
            await prisma.rewardHistory.create({
                data: {
                    userId, gameId, sourceType: SourceType.luckybox,
                    sourceId: String(selected.id), rewardType: selected.rewardType,
                    rewardId: selected.rewardId, quantity: selected.quantity
                }
            });

            // LOG ACTION: Ghi lại hành động mở quà và kết quả trúng thưởng
            PrizeActionLogger.info(`User ${userId} mở Luckybox trúng ${selected.quantity} ${selected.rewardId}`, {
                action: "OPEN_LUCKYBOX",
                userId,
                gameId,
                rewardId: selected.rewardId,
                quantity: selected.quantity,
                rewardType: selected.rewardType
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

    
    // // CHỐT SỔ MÙA GIẢI
    // async finalizeSeason(gameId: string, seasonId: number) {
    //     try {
    //         // Log đánh dấu bắt đầu quy trình chốt sổ
    //         PrizeActionLogger.info(`Bắt đầu xử lý chốt sổ game ${gameId} mùa ${seasonId}`, {
    //             action: "START_FINALIZE_SEASON",
    //             gameId, seasonId
    //         });

    //         // Lấy danh sách từ Redis
    //         const redisUsers = await LeaderboardManager.getAllScores(gameId, seasonId);
            
    //         if (redisUsers.length === 0) {
    //             Logger.warn(`Không có dữ liệu Redis để chốt sổ (Game: ${gameId})`);
    //             return { success: false, message: "Không có dữ liệu để chốt" };
    //         }

    //         // Lấy config quà
    //         const prizeConfigs = await prisma.leaderboardPrizeConfig.findMany({
    //             where: { gameId: gameId, isActive: true }
    //         });

    //         // Lấy info user từ DB
    //         const userIds = redisUsers.map(u => u.value);
    //         const userInfos = await prisma.user.findMany({
    //             where: { username: { in: userIds } },
    //             select: { username: true } 
    //         });

    //         const snapshots = [];
    //         const rewardHistories = [];
    //         let countRewarded = 0;

    //         for (let i = 0; i < redisUsers.length; i++) {
    //             const item = redisUsers[i];
    //             const rank = i + 1;
    //             const userId = item.value;
    //             const score = item.score;
                
    //             const userInfo = userInfos.find(u => u.username === userId);
    //             const userNameDisplay = userInfo ? userInfo.username : userId;

    //             // Tìm quà theo rank
    //             const config = prizeConfigs.find(c => rank >= c.rankFrom && rank <= c.rankTo);

    //             if (config) {
    //                 rewardHistories.push({
    //                     userId: userId,
    //                     gameId: gameId,
    //                     sourceType: SourceType.leaderboard,
    //                     sourceId: seasonId.toString(),
    //                     rewardType: config.rewardType,
    //                     rewardId: config.rewardId,
    //                     quantity: config.quantity
    //                 });
    //                 countRewarded++;

    //                 // LOG ACTION: Ghi lại bằng chứng trao quà (Quan trọng để đối soát)
    //                 PrizeActionLogger.info(`Trao quà Top ${rank} cho user ${userId}`, {
    //                     action: "REWARD_GIVEN",
    //                     userId,
    //                     gameId,
    //                     seasonId,
    //                     rank,
    //                     reward: `${config.quantity} ${config.rewardId}`
    //                 });
    //             }

    //             // Tạo snapshot
    //             snapshots.push({
    //                 gameId: gameId,
    //                 seasonId: seasonId,
    //                 userId: userId,
    //                 userName: userNameDisplay,
    //                 totalScore: BigInt(score), 
    //                 rankScore: rank,
    //                 createdAt: new Date()
    //             });
    //         }

    //         // Transaction lưu vào DB
    //         await prisma.$transaction([
    //             prisma.leaderboardSnapshot.createMany({ data: snapshots }),
    //             prisma.rewardHistory.createMany({ data: rewardHistories }),
    //         ]);

    //         // Log hoàn tất thành công
    //         PrizeActionLogger.info(`Chốt sổ hoàn tất game ${gameId}`, {
    //             action: "FINALIZE_SUCCESS",
    //             gameId,
    //             seasonId,
    //             totalSnapshots: snapshots.length,
    //             totalRewarded: countRewarded
    //         });

    //         return { 
    //             success: true, 
    //             message: `Chốt sổ thành công! Lưu ${snapshots.length} user. Trao thưởng cho ${countRewarded} user.` 
    //         };

    //     } catch (error: any) {
    //         // Log lỗi nghiêm trọng (vào cả File và Mongo)
    //         PrizeActionLogger.error("Lỗi finalizeSeason: " + error.message, { 
    //             gameId, seasonId, stack: error.stack 
    //         });
    //         return { success: false, message: error.message };
    //     }
    // }

    // Chốt sổ mùa giải (Mock data)
    async finalizeSeason(gameId: string, seasonId: number) {
        try {
            PrizeActionLogger.info(`Bắt đầu xử lý chốt sổ game ${gameId} mùa ${seasonId}`, {
                action: "START_FINALIZE_SEASON", gameId, seasonId
            });

            const redisUsers = await LeaderboardManager.getAllScores(gameId, seasonId);
            
            if (redisUsers.length === 0) {
                Logger.warn(`Không có dữ liệu Redis để chốt sổ (Game: ${gameId})`);
                return { success: false, message: "Không có dữ liệu để chốt" };
            }

            const prizeConfigs = await prisma.leaderboardPrizeConfig.findMany({
                where: { gameId: gameId, isActive: true }
            });

            const userIds = redisUsers.map(u => u.value);
            const userInfos = await this.getUsersDisplayInfo(userIds); 
            // ------------------------------------------

            const snapshots = [];
            const rewardHistories = [];
            let countRewarded = 0;

            for (let i = 0; i < redisUsers.length; i++) {
                const item = redisUsers[i];
                const rank = i + 1;
                const userId = item.value;
                const score = item.score;
                
                const userInfo = userInfos.find(u => u.username === userId);
                const userNameDisplay = userInfo ? userInfo.username : userId;

                const config = prizeConfigs.find(c => rank >= c.rankFrom && rank <= c.rankTo);

                if (config) {
                    rewardHistories.push({
                        userId: userId,
                        gameId: gameId,
                        sourceType: SourceType.leaderboard,
                        sourceId: seasonId.toString(),
                        rewardType: config.rewardType,
                        rewardId: config.rewardId,
                        quantity: config.quantity
                    });
                    countRewarded++;

                    PrizeActionLogger.info(`Trao quà Top ${rank} cho user ${userId}`, {
                        action: "REWARD_GIVEN",
                        userId, gameId, seasonId, rank,
                        reward: `${config.quantity} ${config.rewardId}`
                    });
                }

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

            await prisma.$transaction([
                prisma.leaderboardSnapshot.createMany({ data: snapshots }),
                prisma.rewardHistory.createMany({ data: rewardHistories }),
            ]);

            PrizeActionLogger.info(`Chốt sổ hoàn tất game ${gameId}`, {
                action: "FINALIZE_SUCCESS",
                gameId, seasonId,
                totalSnapshots: snapshots.length,
                totalRewarded: countRewarded
            });

            return { 
                success: true, 
                message: `Chốt sổ thành công! Lưu ${snapshots.length} user. Trao thưởng cho ${countRewarded} user.` 
            };

        } catch (error: any) {
            PrizeActionLogger.error("Lỗi finalizeSeason: " + error.message, { 
                gameId, seasonId, stack: error.stack 
            });
            return { success: false, message: error.message };
        }
    }
}