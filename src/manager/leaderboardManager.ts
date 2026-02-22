import { BaseRedisManager } from "./BaseRedisManager";
import { RedisClient } from "../utils/RedisClient";
import { Logger, PrizeActionLogger } from "../utils/Logger"; 

class LeaderboardManagerClass extends BaseRedisManager<any> {
    
    protected getPrefix(): string { return "lb:"; }

    protected getTTL(): number { 
        return 14 * 24 * 60 * 60; // 14 ngày (tính bằng giây)
    }

    private getLbKey(gameId: string, seasonId: number | string): string {
        return `${this.getPrefix()}${gameId}:${seasonId}`;
    }

    // --- CÁC HÀM XỬ LÝ LOGIC ---

    // Cộng điểm cho user
    async addScore(gameId: string, seasonId: number, userId: string, scorePlus: number) {
        try {
            const key = this.getLbKey(gameId, seasonId);
            
            const newScore = await RedisClient.zIncrBy(key, scorePlus, userId);
            
            PrizeActionLogger.info(`User ${userId} nạp điểm`, {
                action: "SUBMIT_SCORE",
                userId: userId,
                gameId: gameId,
                seasonId: seasonId,
                scoreAdded: scorePlus,
                newTotal: Number(newScore),
                timestamp: new Date()
            });

            return Number(newScore);

        } catch (e: any) {
            PrizeActionLogger.error(`Lỗi addScore: ${e.message}`, { 
                userId, 
                gameId, 
                stack: e.stack 
            });
            return 0;
        }
    }

    // Lấy Top bảng xếp hạng (Mặc định Top 10)
    async getTopList(gameId: string, seasonId: number, limit: number = 10) {
        try {
            const key = this.getLbKey(gameId, seasonId);
            
            Logger.info(`Lấy Top ${limit} game ${gameId} mùa ${seasonId}`);

            const list = await RedisClient.zRangeWithScores(key, 0, -1);
            
            // Sắp xếp cao -> thấp và cắt lấy limit
            return list.reverse().slice(0, limit);

        } catch (e: any) { 
            Logger.error(`Lỗi getTopList: ${e.message}`, { stack: e.stack });
            return []; 
        }
    }


    // Lấy thông tin hạng và điểm của 1 user cụ thể
    async getUserRankInfo(gameId: string, seasonId: number, userId: string) {
        try {
            const key = this.getLbKey(gameId, seasonId);
            
            const [rank, score] = await Promise.all([
                RedisClient.zRevRank(key, userId),
                RedisClient.zScore(key, userId)
            ]);

            return {
                rank: rank !== null ? rank + 1 : null, // Cộng 1 để Rank bắt đầu từ 1
                score: score ? Number(score) : 0
            };
        } catch (e: any) { 
            Logger.error(`Lỗi getUserRankInfo (User: ${userId}): ${e.message}`);
            return { rank: null, score: 0 }; 
        }
    }

    // Lấy TOÀN BỘ danh sách người chơi để chốt sổ (Snapshot)
    async getAllScores(gameId: string, seasonId: number) {
        try {
            const key = this.getLbKey(gameId, seasonId);
            
            PrizeActionLogger.info(`Bắt đầu Snapshot dữ liệu game ${gameId} mùa ${seasonId}`, {
                action: "START_SNAPSHOT",
                gameId,
                seasonId
            });

            // Lấy toàn bộ danh sách (Xuôi)
            const list = await RedisClient.zRangeWithScores(key, 0, -1);
            
            // Đảo ngược (Cao -> Thấp)
            const reversedList = list.reverse();

            Logger.info(`Snapshot hoàn tất: Tìm thấy ${reversedList.length} user.`);
            return reversedList;

        } catch (e: any) {
            PrizeActionLogger.error(`Lỗi getAllScores (Critical): ${e.message}`, { stack: e.stack });
            return [];
        }
    }


    // Xóa bảng xếp hạng thủ công
    async deleteLeaderboard(gameId: string, seasonId: number) {
        try {
            const key = this.getLbKey(gameId, seasonId);
            await RedisClient.del(key);
            
            Logger.info(`Đã xóa thủ công Redis Key: ${key}`);
        } catch (e: any) {
            Logger.error(`Lỗi deleteLeaderboard: ${e.message}`);
        }
    }
    // Lấy danh sách phân trang
    async getPagedList(gameId: string, seasonId: number, start: number, stop: number) {
        try {
            const key = this.getLbKey(gameId, seasonId);
            const rawResult = await RedisClient.sendCommand([
                'ZREVRANGE', 
                key, 
                String(start), 
                String(stop), 
                'WITHSCORES'
            ]);
            const list = [];
            
            if (Array.isArray(rawResult)) {
                for (let i = 0; i < rawResult.length; i += 2) {
                    list.push({
                        value: String(rawResult[i]),       // User ID
                        score: Number(rawResult[i + 1])    // Điểm số
                    });
                }
            }

            return list;

        } catch (e: any) {
            Logger.error(`Lỗi getPagedList: ${e.message}`, { stack: e.stack });
            return [];
        }
    }
    // Đếm tổng người chơi
    async getTotalCount(gameId: string, seasonId: number) {
        try {
            const key = this.getLbKey(gameId, seasonId);
            return await RedisClient.zCard(key);
        } catch (e: any) {
            return 0;
        }
    }
}

export const LeaderboardManager = new LeaderboardManagerClass();