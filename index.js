import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import UserRouter from "./routes/userRoute.js";
import feedbackRouter from "./routes/feedbackRoute.js";
import dotenv from "dotenv";
import cors from "cors";
import sessionRouter from "./routes/sessionRouter.js";
import scoreRouter from "./routes/scoreRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// API Routes
app.use("/auth", authRoutes);
app.use("/api/user", UserRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/session", sessionRouter);
app.use("/api/score", scoreRouter);

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "University of Kelaniya - Tutoring Support Center (TSC) API is live 🚀",
    version: "1.0.0"
  });
});

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://admin:123@cluster0.mvqv9dh.mongodb.net/?appName=Cluster0";

// Cached Mongoose Connection for Serverless (Vercel) & Local
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    const db = await mongoose.connect(MONGO_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("DB established successfully 🤖📱");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
};

connectDB();

// Middleware to ensure DB connection on serverless calls
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`App is listen on port ${PORT} 🍎✅`);
  });
}

export default app;