import express from "express";
import { 
    submitFeedback, 
    getSessionFeedback, 
    getTutorFeedback, 
    getAllFeedbacks 
} from "../controllers/feedbackController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { authMiddlewaretemp } from "../middlewares/authMiddlewareTEMP.js";

const feedbackRouter = express.Router();

// Submit feedback (handles authMiddlewaretemp and authenticateToken)
feedbackRouter.post("/feedback", authMiddlewaretemp, submitFeedback);
feedbackRouter.post("/", authenticateToken, submitFeedback);

// Retrieval routes
feedbackRouter.get("/session/:sessionId", authenticateToken, getSessionFeedback);
feedbackRouter.get("/tutor", authenticateToken, getTutorFeedback);
feedbackRouter.get("/tutor/:tutorId", authenticateToken, getTutorFeedback);
feedbackRouter.get("/all", authenticateToken, getAllFeedbacks);

export default feedbackRouter;