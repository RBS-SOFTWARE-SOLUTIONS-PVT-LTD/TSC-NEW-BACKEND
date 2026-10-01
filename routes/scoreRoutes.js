import express from "express";
import { getLiveScores, getMonthlyScores, getMyCurrentScore, getAnnualScores, getAnnualAwards } from "../controllers/scoreController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const scoreRouter = express.Router();

// Route for Tutor's Own Current Live Score
scoreRouter.get("/my-score", authenticateToken, getMyCurrentScore);

// Route for Live Scores (Current ongoing month)
scoreRouter.get("/live", authenticateToken, getLiveScores);

// Route for Historical / Selected Monthly Scores
scoreRouter.get("/monthly", authenticateToken, getMonthlyScores);

// Route for Annual Scores
scoreRouter.get("/annual", authenticateToken, getAnnualScores);

// Route for Annual Awards
scoreRouter.get("/annual-awards", authenticateToken, getAnnualAwards);

export default scoreRouter;



