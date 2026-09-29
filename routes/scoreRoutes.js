import express from "express";
import { getLiveScores, getMonthlyScores, getMyCurrentScore } from "../controllers/scoreController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const scoreRouter = express.Router();

// Route for Tutor's Own Current Live Score
scoreRouter.get("/my-score", authenticateToken, getMyCurrentScore);

// Route for Live Scores (Current ongoing month)
scoreRouter.get("/live", authenticateToken, getLiveScores);

// Route for Historical / Selected Monthly Scores
scoreRouter.get("/monthly", authenticateToken, getMonthlyScores);

export default scoreRouter;

