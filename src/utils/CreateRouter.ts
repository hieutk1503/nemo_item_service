import { RequestHandler, Router } from "express";

type HttpMethod = "get" | "post" | "put" | "delete";

interface RouterConfig{
    method: HttpMethod;
    path: string;
    handler: string;
    middlewares?: RequestHandler[];
}

export function createRouter(controller: any, routers: RouterConfig[]){
    const router = Router();

    routers.forEach(r => {
        const middlewares = r.middlewares || [];
        
        const handler = controller[r.handler]
        // Dấu ... (spread) giúp rải các middleware vào tham số của express
        router[r.method](r.path,...middlewares, handler);
    });

    return router;
}