import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config({path:"./env"})
connectDB().then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log('Mongodb Connected Successfully')
    })
}).catch(console.log("Mongo db connection failed"))