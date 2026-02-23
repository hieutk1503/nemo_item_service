import { Request, Response } from "express";
import { LeaderboardManager } from "../manager/leaderboardManager";
import { PrizeService } from "../services/prizeService";
import { APIResponse, HttpStatusCode } from "../utils/APIResponse"; 
import { Logger } from "../utils/Logger"; 
import { I18n } from "../helpers/i18nHelper";
import prisma from "../configs/PrismaContext";

export class PrizeControllerCMS {

    // Khai báo Manager để xử lý Redis
    private readonly _lbManager = LeaderboardManager;
    
    // Tạm để test CMS
    async getUserInfo(req: any, res: any) {
        return res.json({
            code: 0, 
            data: {
                username: 'admin',
                realName: 'Lê Bá Hải',
                roles: ['admin'], 
                avatar: '',
                desc: 'Manager'
            },
            message: 'ok'
        });
    }

    // --- QUẢN LÝ LUCKYBOX ---

    // Lấy danh sách quà
    getLuckyboxList = async (req: any, res: Response) => {
        try {
            const data = await prisma.luckyboxPrizeConfig.findMany({
                orderBy: { id: 'asc' },
                include: { 
                    game: { select: { name: true } } 
                }
            });

            return res.json({
                code: 0,
                data: data,
                message: 'Thành công'
            });
        } catch (error: any) {
            Logger.error("Lỗi lấy danh sách Luckybox: " + error.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi DB: " + error.message));
        }
    }

    // Thêm cấu hình quà
    addLuckyboxConfig = async (req: any, res: Response) => {
        try {
            const { gameId, rewardType, rewardId, quantity, weight, isActive } = req.body;

            const newItem = await prisma.luckyboxPrizeConfig.create({
                data: {
                    gameId: gameId || 'MYSTERY_BOX',
                    rewardType: rewardType || 'Items',
                    rewardId: String(rewardId),
                    quantity: Number(quantity) || 1,
                    weight: Number(weight) || 0,
                    isActive: isActive !== undefined ? isActive : true
                }
            });

            return res.json({
                code: 0,
                data: newItem,
                message: 'Thêm cấu hình quà mới thành công!'
            });
        } catch (error: any) {
            console.error("Lỗi khi thêm quà:", error.message);
            return res.status(500).json({
                code: 1,
                message: "Không thể thêm quà: " + error.message
            });
        }
    }

    // Sửa cấu hình quà
    updateLuckyboxConfig = async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            const { weight, quantity, isActive } = req.body;

            const updated = await prisma.luckyboxPrizeConfig.update({
                where: { id: Number(id) },
                data: { 
                    weight: Number(weight), 
                    quantity: Number(quantity), 
                    isActive: Boolean(isActive)
                }
            });

            return res.json({ 
                code: 0, 
                data: updated, 
                message: 'Cập nhật cấu hình thành công' 
            });
        } catch (error: any) {
            return res.status(500).json({ code: 1, message: error.message });
        }
    }

    // Xoá quà
    deleteLuckyboxConfig = async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            await prisma.luckyboxPrizeConfig.delete({
                where: { id: Number(id) }
            });
            return res.json({ code: 0, message: 'Xóa thành công' });
        } catch (error: any) {
            return res.status(500).json({ code: 1, message: error.message });
        }
    }

    // --- QUẢN LÝ LEADERBOARD (Real-time Redis) ---

    getLeaderboardListCMS = async (req: any, res: Response) => {
        try {
            // 1. Lấy tham số phân trang
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;
            const gameId = req.query.gameId as string || 'MYSTERY_BOX';
            const seasonId = req.query.seasonId ? Number(req.query.seasonId) : 1; 

            // 2. Tính toán vị trí start/stop cho Redis
            const start = (page - 1) * pageSize;
            const stop = start + pageSize - 1;

            // 3. Gọi Redis lấy danh sách ID và Điểm
            // QUAN TRỌNG: Thêm 'as any[]' để sửa lỗi Property 'length' does not exist
            const redisData = await this._lbManager.getPagedList(gameId, seasonId, start, stop) as any[];
            const totalRecords = await this._lbManager.getTotalCount(gameId, seasonId);

            // Nếu Redis trống
            if (!redisData || redisData.length === 0) {
                 return res.json({
                    code: 0,
                    data: { items: [], total: 0 },
                    message: 'Chưa có dữ liệu xếp hạng'
                });
            }

            // 4. Lấy danh sách User ID từ kết quả Redis
            const userIds = redisData.map((item: any) => item.value);

            // 5. Query MySQL để lấy thông tin hiển thị (Tên, Username)
            const usersInfo = await prisma.user.findMany({
                where: { msisdn: { in: userIds } },
                select: { msisdn: true, fullName: true, username: true }
            });

            // 6. Map dữ liệu Redis (Điểm) với MySQL (Info)
            const finalResult = redisData.map((rItem: any, index: number) => {
                const uInfo = usersInfo.find(u => u.msisdn === rItem.value);
                return {
                    id: rItem.value,
                    rank: start + index + 1,
                    userId: rItem.value,
                    fullName: uInfo?.fullName || uInfo?.username || 'Chưa cập nhật tên',
                    score: rItem.score,
                    gameId: gameId,
                    seasonId: seasonId
                };
            });

            return res.json({
                code: 0,
                data: {
                    items: finalResult,
                    total: totalRecords
                },
                message: 'Lấy dữ liệu thành công'
            });

        } catch (error: any) {
            console.error("Lỗi CMS Leaderboard:", error);
            return res.status(500).json({ 
                code: 1, 
                message: "Lỗi Server: " + error.message 
            });
        }
    }
    // LỊCH SỬ NẠP ĐIỂM (CMS)
    getScoreHistoryCMS = async (req: any, res: Response) => {
        try {
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;
            const gameId = req.query.gameId as string;
            const userId = req.query.userId as string;
            const username = req.query.username as string; // Nhận thêm tham số username

            // Điều kiện lọc
            const whereCondition: any = {};
            if (gameId) whereCondition.gameId = gameId;
            if (userId) whereCondition.userId = { contains: userId };
            
            // Lọc theo Username (liên kết sang bảng User)
            if (username) {
                whereCondition.user = {
                    username: { contains: username }
                };
            }

            const [data, total] = await Promise.all([
                prisma.scoreHistory.findMany({
                    where: whereCondition,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { fullName: true, username: true } } }
                }),
                prisma.scoreHistory.count({ where: whereCondition })
            ]);

            const formattedData = data.map(item => ({
                id: item.id,
                userId: item.userId,
                username: item.user?.username || 'Chưa có', // Trả về thêm username
                fullName: item.user?.fullName || 'Chưa định danh',
                gameId: item.gameId,
                seasonId: item.seasonId,
                scorePlus: item.scorePlus,
                totalScore: item.totalScore.toString(),
                createdAt: item.createdAt
            }));

            return res.json({ code: 0, data: { items: formattedData, total }, message: 'Success' });
        } catch (error: any) {
            return res.status(500).json({ code: 1, message: error.message });
        }
    }

    // LỊCH SỬ NHẬN QUÀ (CMS)
    getRewardHistoryCMS = async (req: any, res: Response) => {
        try {
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;
            const gameId = req.query.gameId as string;
            const userId = req.query.userId as string;
            const username = req.query.username as string; // Nhận thêm tham số username

            const whereCondition: any = {};
            if (gameId) whereCondition.gameId = gameId;
            if (userId) whereCondition.userId = { contains: userId };
            
            // Lọc theo Username
            if (username) {
                whereCondition.user = {
                    username: { contains: username }
                };
            }

            const [data, total] = await Promise.all([
                prisma.rewardHistory.findMany({
                    where: whereCondition,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { fullName: true, username: true } } }
                }),
                prisma.rewardHistory.count({ where: whereCondition })
            ]);

            const formattedData = data.map(item => ({
                id: item.id,
                userId: item.userId,
                username: item.user?.username || 'Chưa có', // Trả về thêm username
                fullName: item.user?.fullName || 'Chưa định danh',
                gameId: item.gameId,
                sourceType: item.sourceType,
                rewardType: item.rewardType,
                rewardId: item.rewardId,
                quantity: item.quantity,
                createdAt: item.createdAt
            }));

            return res.json({ code: 0, data: { items: formattedData, total }, message: 'Success' });
        } catch (error: any) {
            return res.status(500).json({ code: 1, message: error.message });
        }
    }
    // --- QUẢN LÝ LEADERBOARD PRIZE CONFIG ---

    // 1. Lấy danh sách cấu hình giải đua top
    getLeaderboardPrizeList = async (req: any, res: Response) => {
        try {
            const data = await prisma.leaderboardPrizeConfig.findMany({
                orderBy: { id: 'asc' },
                include: { 
                    game: { select: { name: true } } 
                }
            });

            return res.json({
                code: 0,
                data: data,
                message: 'Thành công'
            });
        } catch (error: any) {
            Logger.error("Lỗi lấy danh sách Leaderboard Prize: " + error.message);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi DB: " + error.message));
        }
    }

    // 2. Thêm cấu hình giải mới
    addLeaderboardPrizeConfig = async (req: any, res: Response) => {
        try {
            const { gameId, rankFrom, rankTo, rewardType, rewardId, quantity, isActive } = req.body;

            const newItem = await prisma.leaderboardPrizeConfig.create({
                data: {
                    gameId: gameId || 'MYSTERY_BOX',
                    rankFrom: Number(rankFrom) || 1,
                    rankTo: Number(rankTo) || 1,
                    rewardType: rewardType || 'Items',
                    rewardId: String(rewardId),
                    quantity: Number(quantity) || 1,
                    isActive: isActive !== undefined ? isActive : true
                }
            });

            return res.json({
                code: 0,
                data: newItem,
                message: 'Thêm cấu hình giải mới thành công!'
            });
        } catch (error: any) {
            console.error("Lỗi khi thêm giải đua top:", error.message);
            return res.status(500).json({
                code: 1,
                message: "Không thể thêm giải: " + error.message
            });
        }
    }

    // 3. Sửa cấu hình giải
    updateLeaderboardPrizeConfig = async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            const { rankFrom, rankTo, quantity, isActive } = req.body;

            const updated = await prisma.leaderboardPrizeConfig.update({
                where: { id: Number(id) },
                data: { 
                    rankFrom: Number(rankFrom), 
                    rankTo: Number(rankTo), 
                    quantity: Number(quantity), 
                    isActive: Boolean(isActive)
                }
            });

            return res.json({ 
                code: 0, 
                data: updated, 
                message: 'Cập nhật cấu hình thành công' 
            });
        } catch (error: any) {
            return res.status(500).json({ code: 1, message: error.message });
        }
    }

    // 4. Xoá cấu hình giải
    deleteLeaderboardPrizeConfig = async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            await prisma.leaderboardPrizeConfig.delete({
                where: { id: Number(id) }
            });
            return res.json({ code: 0, message: 'Xóa thành công' });
        } catch (error: any) {
            return res.status(500).json({ code: 1, message: error.message });
        }
    }
}