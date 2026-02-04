import mongoose from "mongoose";
import {Logger} from "../utils/Logger";
export const connectMongoDB = async () => {
    try{
        const url = process.env.MONGO_URI || "";
        await mongoose.connect(url);
        Logger.info("MongoDB Connected")
    }
    catch(err){
        Logger.info("MongoDB Connection Error: "+ err);
    }
}