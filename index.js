import express from "express"
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
let app = express();
app.use(express.json());
app.use(cors());


app.use("/auth", authRoutes);


mongoose.connect("mongodb+srv://admin:123@cluster0.mvqv9dh.mongodb.net/?appName=Cluster0");
let connection = mongoose.connection;

connection.once("open", ()=>{
    console.log("DB established successfully 🤖📱");
});


app.listen(3000, ()=>
{
    console.log("App is listen on port 3000 🍎✅");
})