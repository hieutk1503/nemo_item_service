import { PrizeController } from "../controllers/prizeController";
import { createRouter } from "../utils/CreateRouter";
import { JwtAuthMiddle } from "../middlewares/JwtAuthMiddle";
import { LangMiddle } from "../middlewares/LangMiddle";

const controller = new PrizeController();

export default createRouter(controller, [
    // --- KHU VỰC PUBLIC ---
    {
        method: 'get',
        path: '/leaderboard',       // API: /api/leaderboard?gameId=...
        handler: 'getLeaderboard' ,
        middlewares: [
            JwtAuthMiddle, 
            LangMiddle                 
        ] 
    },
    

    // --- KHU VỰC ACTION (Có thể cần bảo vệ) ---
    {
        method: 'get',
        path: '/history',           // API: /api/history?type=reward...
        handler: 'getMyHistory',
        middlewares: [
            JwtAuthMiddle, 
            LangMiddle                 
        ]
    },
    {
        method: 'post',
        path: '/luckybox/open',     // API: /api/luckybox/open
        handler: 'playLuckybox',
        middlewares: [
            JwtAuthMiddle,  
            LangMiddle            
        ]
    },
    {
        method: 'post',
        path: '/score/submit',      // API: /api/score/submit
        handler: 'submitScore',
         middlewares: [
            JwtAuthMiddle,
            LangMiddle                   
        ]
    },
    
    {
        method: 'post',
        path: '/season/end',    // API: /api/season/end
        handler: 'endSeason',
         middlewares: [
            JwtAuthMiddle, 
            LangMiddle                  
        ]  
    },
]);