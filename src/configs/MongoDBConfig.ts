import mongoose from "mongoose";

export const connectMongoDB = async () => {
    try{
        const url = process.env.MONGO_URI || "";
        await mongoose.connect(url);
        console.log("Mongo connected");
    }
    catch(err){
        console.log("❌ MongoDB Connection Error:" + err);
    }
}