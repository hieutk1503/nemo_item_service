import { Request, Response, NextFunction } from "express";

export const CorsMiddle = (req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    if(req.method === "OPTIONS"){
        return res.status(200).send();
    }
    next();
}