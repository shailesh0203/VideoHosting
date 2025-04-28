//require('dotenv').config()
import dotenv from "dotenv"
import { app } from "./app.js";

import mongoose from "mongoose";


import connectDB from "./db/index.js";
dotenv.config({
    path:'./.env'
})
/*const app=express()
;(async()=>{
try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("errror",(error)=>{
        console.log("ERRR: ",error);
        throw error
    })
    app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
    })
} catch (error) {
    console.error("error: ",error)
    throw err
}
})()*/
connectDB()
.then(()=>{
    app.on("errror",(error)=>{
        console.log("ERRR: ",error);
        throw error
    })
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })

})
.catch((err)=>{
    console.log("MONGO db connection failed!!!!",err)
})