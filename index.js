import express from "express"
import mongoose from "mongoose";
import UserRouter from "./routes/userRoute.js";

let app = express();

app.use(express.json());
app.use("/api/auth", UserRouter);


mongoose.connect("mongodb+srv://admin:123@cluster0.mvqv9dh.mongodb.net/?appName=Cluster0");
let connection = mongoose.connection;

connection.once("open", ()=>{
    console.log("DB established successfully 🤖📱");
});

app.listen(3000, ()=>
{
    console.log("App is listen on port 3000 🍎✅");
})