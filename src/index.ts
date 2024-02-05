import 'module-alias/register'
import dotenv from "dotenv";
import connectDB from "@/db/index";
dotenv.config()
import app from "@/app";

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log('Mongodb Connected Successfully')
    })
}).catch((error)=>{console.log("Mongo db connection failed", error)})