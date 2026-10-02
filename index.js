import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import UserRouter from "./routes/userRoute.js";
import feedbackRouter from "./routes/feedbackRoute.js";
import sessionRouter from "./routes/sessionRouter.js";
import scoreRouter from "./routes/scoreRoutes.js";

dotenv.config();

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Complete CORS Configuration (Handles Preflight & Cross-Origin Requests)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true
}));

app.options("*", cors());

// Explicit CORS Headers Fallback Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://admin:123@cluster0.mvqv9dh.mongodb.net/?appName=Cluster0";

// Cached Mongoose Connection for Serverless (Vercel) & Local
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("DB established successfully 🤖📱");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
};

// Ensure database connection is active before processing any API request
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB Middleware Error:", err);
  }
  next();
});

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "University of Kelaniya - Tutoring Support Center (TSC) API is live 🚀",
    version: "1.0.0",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "connecting"
  });
});

// API Routes
app.use("/auth", authRoutes);
app.use("/api/user", UserRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/session", sessionRouter);
app.use("/api/score", scoreRouter);

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Endpoint ${req.method} ${req.url} does not exist on this server.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error occurred",
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT} 🍎✅`);
  });
}

export default app;