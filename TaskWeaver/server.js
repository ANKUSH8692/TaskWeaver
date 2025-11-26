import express from "express";

import {app} from "./app.js";
import dotenv from "dotenv";
import dbConfig from "./db/db.config.js";

dotenv.config();

dbConfig.connectDB();

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);       
})
