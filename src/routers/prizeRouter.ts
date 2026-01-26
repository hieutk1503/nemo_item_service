import { PrizeController } from "../controllers/prizeController";
import { createRouter } from "../utils/CreateRouter";

const controller = new PrizeController();

export default createRouter(controller, [
    // --- KHU VỰC PUBLIC ---
    {
        method: 'get',
        path: '/leaderboard',       // API: /api/leaderboard?gameId=...
        handler: 'getLeaderboard'  
    },
    {
        method: 'get',
        path: '/history',           // API: /api/history?type=reward...
        handler: 'getMyHistory'
    },

    // --- KHU VỰC ACTION (Có thể cần bảo vệ) ---
    {
        method: 'post',
        path: '/luckybox/open',     // API: /api/luckybox/open
        handler: 'playLuckybox'
    },
    {
        method: 'post',
        path: '/score/submit',      // API: /api/score/submit
        handler: 'submitScore'
    },
    
    {
        method: 'post',
        path: '/season/end',    // API: /api/season/end
        handler: 'endSeason'    
    }
]);