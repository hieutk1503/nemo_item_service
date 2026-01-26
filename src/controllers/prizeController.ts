import { Request, Response } from "express";
import { LeaderboardManager } from "../manager/leaderboardManager";
import { PrizeService } from "../services/prizeService";
import { APIResponse, HttpStatusCode } from "../utils/APIResponse"; 
import { Logger } from "../utils/Logger"; 

export class PrizeController {
    
    private readonly _lbManager = LeaderboardManager; 
    private readonly _service = new PrizeService();

    private maskPhone(phone: string): string {
        return phone.replace(/.{4}$/, '****');
    }

    // Handler: Lấy Bảng Xếp Hạng
    getLeaderboard = async (req: Request, res: Response) => {
        try {
            const { gameId, seasonId } = req.query;
            const userId = req.query.userId as string || "guest";

            if (!gameId || !seasonId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu gameId hoặc seasonId"));
            }

            // 1. Lấy Top 10 từ Redis
            const topRedis = await this._lbManager.getTopList(String(gameId), Number(seasonId), 10);
            
            // 2. Lấy Rank & Info của bản thân (Me) từ Redis
            let myRankRedis = { rank: null as number | null, score: 0 };
            if (userId !== "guest") {
                myRankRedis = await this._lbManager.getUserRankInfo(String(gameId), Number(seasonId), userId);
            }

            // 3. Gộp danh sách ID để gọi DB 1 lần duy nhất
            const userIdsToFetch = topRedis.map(i => i.value);
            
            // Nếu "Me" có thực (không phải guest) VÀ "Me" chưa nằm trong Top 10
            // thì mới thêm ID của "Me" vào danh sách cần lấy info
            if (userId !== "guest" && !userIdsToFetch.includes(userId)) {
                userIdsToFetch.push(userId);
            }

            // 4. Lấy thông tin hiển thị (Gọi DB 1 lần cho tất cả)
            const usersInfo = await this._service.getUsersDisplayInfo(userIdsToFetch);

            // 5. Map dữ liệu Leaderboard (Top 10)
            const leaderboard = topRedis.map((item, index) => {
                const info = usersInfo.find(u => u.username === item.value);
                let displayPhone = item.value;
                if (info && info.msisdn && info.msisdn.length >= 5) {
                    displayPhone = this.maskPhone(info.msisdn);
                }
                return {
                    rank: index + 1,
                    phone: displayPhone,
                    score: item.score
                };
            });

            // 6. Map dữ liệu của "Me"
            let me = null;
            if (userId !== "guest") {
                 // Tìm info của mình trong đống dữ liệu vừa lấy về
                 const myInfo = usersInfo.find(u => u.username === userId);
                 let myDisplayPhone = userId;
                 
                 if (myInfo && myInfo.msisdn && myInfo.msisdn.length >= 5) {
                     myDisplayPhone = this.maskPhone(myInfo.msisdn);
                 }

                 me = {
                     rank: myRankRedis.rank, // Rank lấy từ Redis (ví dụ: 50)
                     phone: myDisplayPhone,
                     score: myRankRedis.score
                 };
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Lấy BXH thành công", { leaderboard, me }));

        } catch (error: any) {
            Logger.error("Controller Error getLeaderboard: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi hệ thống: " + error.message));
        }
    }

    // Handler: Nạp điểm 
    submitScore = async (req: Request, res: Response) => {
        try {
            const { userId, gameId, seasonId, score } = req.body;
            
            if (!userId || !gameId || !score) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Dữ liệu nạp điểm không hợp lệ"));
            }

            const newTotal = await this._lbManager.addScore(gameId, Number(seasonId), userId, Number(score));
            
            this._service.logScoreHistory(userId, gameId, Number(seasonId), Number(score), newTotal);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Cộng điểm thành công", { newTotal }));
        } catch (error: any) {
            Logger.error("Controller Error submitScore: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi hệ thống: " + error.message));
        }
    }

    // Handler: Mở Luckybox 
    playLuckybox = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = req.body;
            
            const result = await this._service.openLuckyBox(userId, gameId);
            
            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(result.message, result.data));
        } catch (error: any) {
            Logger.error("Controller Error playLuckybox: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi hệ thống: " + error.message));
        }
    }

    // Handler: Lấy lịch sử 
    getMyHistory = async (req: Request, res: Response) => {
        try {
            const userId = req.query.userId as string;
            const gameId = req.query.gameId as string;
            const type = (req.query.type as string) || 'reward';
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;

            if (!userId || !gameId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu userId hoặc gameId"));
            }

            const result = await this._service.getHistory(userId, gameId, type, page, limit);
            
            if (!result.success) {
                 return res.status(HttpStatusCode.BAD_REQUEST)
                           .json(APIResponse.BadRequest(result.message));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(result.message, result.data));
        } catch (error: any) {
            Logger.error("Controller Error getMyHistory: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi hệ thống: " + error.message));
        }
    }

    /**
     * Handler: Kết thúc mùa giải 
     * API: POST /api/season/end
     */
    endSeason = async (req: Request, res: Response) => {
        try {
            const { gameId, seasonId } = req.body;

            // Validate dữ liệu đầu vào
            if (!gameId || !seasonId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu gameId hoặc seasonId"));
            }

            // Gọi Logic chốt sổ bên Service 
            const result = await this._service.finalizeSeason(gameId, Number(seasonId));

            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(result.message));

        } catch (error: any) {
            Logger.error("Controller Error endSeason: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi hệ thống: " + error.message));
        }
    }
}