import express from "express";

import {
    submitFeedback,
    getSessionFeedback,
    getTutorFeedback,
    getAllFeedbacks
} from "../controllers/feedbackController.js";

import { authenticateToken } from "../middlewares/authMiddleware.js";

import {
    getTutorRating,
    getHighestRatedTutorController
} from "../controllers/ratingController.js";

const feedbackRouter = express.Router();

// Submit feedback
feedbackRouter.post("/feedback", authenticateToken, submitFeedback);
feedbackRouter.post("/", authenticateToken, submitFeedback);


// Feedback retrieval
feedbackRouter.get("/session/:sessionId", authenticateToken, getSessionFeedback);
feedbackRouter.get("/tutor", authenticateToken, getTutorFeedback);
feedbackRouter.get("/tutor/:tutorId", authenticateToken, getTutorFeedback);
feedbackRouter.get("/all", authenticateToken, getAllFeedbacks);

// Tutor ratings
feedbackRouter.get("/tutor-ratings/:tutorId", getTutorRating);
feedbackRouter.get("/highest-rated-tutor", getHighestRatedTutorController);

export default feedbackRouter;