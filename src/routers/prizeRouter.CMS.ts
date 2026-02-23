import { PrizeControllerCMS } from "../controllers/prizeController.CMS";
import { createRouter } from "../utils/CreateRouter";
import { JwtAuthMiddle } from "../middlewares/JwtAuthMiddle";
import { LangMiddle } from "../middlewares/LangMiddle";

const controller = new PrizeControllerCMS();

export default createRouter(controller, [
    // tạm để test CMS
    {
        method: 'get',
        path: '/user/info',         // API: /api/user/info
        handler: 'getUserInfo',     
        middlewares: [
            LangMiddle 
        ]
    },
    // --- LUCKYBOX ---
    {
        method: 'get',
        path: '/gaming/luckybox/list', 
        handler: 'getLuckyboxList',
        middlewares: [LangMiddle]
    },
    {
         method: 'post',
        path: '/gaming/luckybox/add', 
        handler: 'addLuckyboxConfig' 
    },
    { 
        method: 'put', 
        path: '/gaming/luckybox/update/:id', 
        handler: 'updateLuckyboxConfig' 
    },
    {   method: 'delete', 
        path: '/gaming/luckybox/delete/:id', 
        handler: 'deleteLuckyboxConfig' 
    },
    // --- LEADERBOARD ---
    {
        method: 'get',
        path: '/gaming/leaderboard/list', 
        handler: 'getLeaderboardListCMS'
    },
    // --- LỊCH SỬ ---
    {
        method: 'get',
        path: '/gaming/history/scores', 
        handler: 'getScoreHistoryCMS',
        middlewares: [LangMiddle] // Có thể thêm JwtAuthMiddle sau nếu cần bảo mật
    },
    {
        method: 'get',
        path: '/gaming/history/rewards', 
        handler: 'getRewardHistoryCMS',
        middlewares: [LangMiddle]
    },
    // --- LEADERBOARD PRIZE CONFIG ---
    {
        method: 'get',
        path: '/gaming/leaderboard-prize/list', 
        handler: 'getLeaderboardPrizeList',
        middlewares: [LangMiddle]
    },
    {
        method: 'post',
        path: '/gaming/leaderboard-prize/add', 
        handler: 'addLeaderboardPrizeConfig' 
    },
    { 
        method: 'put', 
        path: '/gaming/leaderboard-prize/update/:id', 
        handler: 'updateLeaderboardPrizeConfig' 
    },
    {   
        method: 'delete', 
        path: '/gaming/leaderboard-prize/delete/:id', 
        handler: 'deleteLeaderboardPrizeConfig' 
    }
]);