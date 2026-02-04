import { PrizeController } from "../controllers/prizeController";
import { createRouter } from "../utils/CreateRouter";
import { JwtAuthMiddle } from "../middlewares/JwtAuthMiddle";

const controller = new PrizeController();

export default createRouter(controller, [
    // --- KHU VỰC PUBLIC ---
    {
        method: 'get',
        path: '/leaderboard',       // API: /api/leaderboard?gameId=...
        handler: 'getLeaderboard'  
    },
    

    // --- KHU VỰC ACTION (Có thể cần bảo vệ) ---
    {
        method: 'get',
        path: '/history',           // API: /api/history?type=reward...
        handler: 'getMyHistory',
        middlewares: [
            JwtAuthMiddle,                  
        ]
    },
    {
        method: 'post',
        path: '/luckybox/open',     // API: /api/luckybox/open
        handler: 'playLuckybox',
        middlewares: [
            JwtAuthMiddle,                  
        ]
    },
    {
        method: 'post',
        path: '/score/submit',      // API: /api/score/submit
        handler: 'submitScore',
         middlewares: [
            JwtAuthMiddle,                  
        ]
    },
    
    {
        method: 'post',
        path: '/season/end',    // API: /api/season/end
        handler: 'endSeason',
         middlewares: [
            JwtAuthMiddle,                  
        ]   
    }
]);