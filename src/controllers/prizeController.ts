import { Request, Response } from "express";
import { LeaderboardManager } from "../manager/leaderboardManager";
import { PrizeService } from "../services/prizeService";
import { APIResponse, HttpStatusCode } from "../utils/APIResponse"; 
import { Logger } from "../utils/Logger"; 
import { I18n } from "../helpers/i18nHelper";

export class PrizeController {
    
    private readonly _lbManager = LeaderboardManager; 
    private readonly _service = new PrizeService();

    private maskPhone(phone: string): string {
        return phone.replace(/.{4}$/, '****');  
    }

    private getUserIdFromToken(req: any): string | null {
        if (!req.user) return null;
        return req.user.msisdn || req.user.userId || null;
    }

    // Handler: Lấy Bảng Xếp Hạng
    getLeaderboard = async (req: any, res: Response) => {
        try {
            const { gameId, seasonId } = req.query;
            
            // 1. Ưu tiên lấy ID từ Token nếu đã đăng nhập, nếu không thì lấy query, cuối cùng là guest
            let userId = this.getUserIdFromToken(req);
            if (!userId) {
                userId = req.query.userId as string || "guest";
            }

            if (!gameId || !seasonId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu gameId hoặc seasonId"));
            }

            // 2. Lấy Top 10 từ Redis
            const topRedis = await this._lbManager.getTopList(String(gameId), Number(seasonId), 10);
            
            // 3. Lấy Rank & Info của bản thân (Me) từ Redis
            let myRankRedis = { rank: null as number | null, score: 0 };
            if (userId !== "guest") {
                myRankRedis = await this._lbManager.getUserRankInfo(String(gameId), Number(seasonId), userId);
            }

            // 4. Gộp danh sách ID để gọi DB 1 lần duy nhất
            const userIdsToFetch = topRedis.map(i => i.value);
            
            if (userId !== "guest" && !userIdsToFetch.includes(userId)) {
                userIdsToFetch.push(userId);
            }

            // 5. Lấy thông tin hiển thị (Gọi DB 1 lần cho tất cả)
            const usersInfo = await this._service.getUsersDisplayInfo(userIdsToFetch);

            // 6. Map dữ liệu Leaderboard (Top 10)
            const leaderboard = topRedis.map((item, index) => {
                const info = usersInfo.find(u => u.username === item.value);
                let rawPhone = info?.msisdn || item.value;
                let displayPhone = this.maskPhone(rawPhone);

                return {
                    rank: index + 1,
                    phone: displayPhone,
                    score: item.score
                };
            });

            // 7. Map dữ liệu của "Me"
            let me = null;
            if (userId !== "guest") {
                 const myInfo = usersInfo.find(u => u.username === userId);
                 let myDisplayPhone = userId;
                 
                 if (myInfo && myInfo.msisdn && myInfo.msisdn.length >= 5) {
                     myDisplayPhone = this.maskPhone(myInfo.msisdn);
                 }

                 me = {
                     rank: myRankRedis.rank,
                     phone: myDisplayPhone,
                     score: myRankRedis.score
                 };
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(I18n.t("LB_SUCCESS", req.lang), { leaderboard, me }));

        } catch (error: any) {
            Logger.error("Controller Error getLeaderboard: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(I18n.t("SYSTEM_ERROR", req.lang) + error.message));
        }
    }

    // Handler: Nạp điểm 
    submitScore = async (req: any, res: Response) => {
        try {
            const userId = this.getUserIdFromToken(req);
            if (!userId) {
                return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.BadRequest(I18n.t("TOKEN_INVALID", req.lang)));
            }

            const { gameId, seasonId, score } = req.body;
            
            if (!gameId || !score) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(I18n.t("INVALID_SCORE_DATA", req.lang)));
            }

            const newTotal = await this._lbManager.addScore(gameId, Number(seasonId), userId, Number(score));
            
            this._service.logScoreHistory(userId, gameId, Number(seasonId), Number(score), newTotal);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(I18n.t("SCORE_SUCCESS", req.lang), { newTotal }));
        } catch (error: any) {
            Logger.error("Controller Error submitScore: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(I18n.t("SYSTEM_ERROR", req.lang) + error.message));
        }
    }

    // Handler: Mở Luckybox (BẮT BUỘC AUTH)
    playLuckybox = async (req: any, res: Response) => {
        try {
            const userId = this.getUserIdFromToken(req);
            if (!userId) {
                return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.BadRequest(I18n.t("TOKEN_INVALID", req.lang)));
            }

            const { gameId } = req.body;
            
            const result = await this._service.openLuckyBox(userId, gameId);
            
            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(I18n.t(result.message, req.lang)));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(I18n.t("LUCKY_SUCCESS", req.lang), result.data));
        } catch (error: any) {
            Logger.error("Controller Error playLuckybox: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(I18n.t("SYSTEM_ERROR", req.lang) + error.message));
        }
    }

    // Handler: Lấy lịch sử (BẮT BUỘC AUTH)
    getMyHistory = async (req: any, res: Response) => {
        try {
            const userId = this.getUserIdFromToken(req);
            if (!userId) {
                return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.BadRequest(I18n.t("TOKEN_INVALID", req.lang)));
            }

            const gameId = req.query.gameId as string;
            const type = (req.query.type as string) || 'reward';
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;

            if (!gameId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(I18n.t("MISSING_GAME_ID", req.lang)));
            }

            const result = await this._service.getHistory(userId, gameId, type, page, limit);
            
            if (!result.success) {
                 return res.status(HttpStatusCode.BAD_REQUEST)
                            .json(APIResponse.BadRequest(I18n.t(result.message, req.lang)));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(I18n.t("HISTORY_SUCCESS", req.lang), result.data));
        } catch (error: any) {
            Logger.error("Controller Error getMyHistory: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(I18n.t("SYSTEM_ERROR", req.lang) + error.message));
        }
    }

    // Handler: Kết thúc mùa giải (ADMIN)
    endSeason = async (req: any, res: Response) => {
        try {
            
            const { gameId, seasonId } = req.body;

            if (!gameId || !seasonId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(I18n.t("MISSING_SEASON_INFO", req.lang)));
            }

            const result = await this._service.finalizeSeason(gameId, Number(seasonId));

            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(I18n.t(result.message, req.lang)));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(I18n.t("FINALIZE_SUCCESS", req.lang)));

        } catch (error: any) {
            Logger.error("Controller Error endSeason: " + error.message, { stack: error.stack });
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(I18n.t("SYSTEM_ERROR", req.lang) + error.message));
        }
    }
}