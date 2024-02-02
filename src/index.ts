import dotenv from "dotenv";
import connectDB from "@/db/index";
import app from "@/app";
import 'module-alias/register'
dotenv.config()
connectDB().then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log('Mongodb Connected Successfully')
    })
}).catch((error)=>{console.log("Mongo db connection failed", error)})