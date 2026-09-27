import express from "express";
import { submitFeedback } from "../controllers/feedbackController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {authMiddlewaretemp} from "../middlewares/authMiddlewareTEMP.js";
import { getTutorRating,getHighestRatedTutorController } from "../controllers/ratingController.js";


const feedbackRouter = express.Router();

feedbackRouter.post("/feedback", authenticateToken, submitFeedback);
feedbackRouter.get("/tutor-ratings/:tutorId",  getTutorRating);
feedbackRouter.get("/highest-rated-tutor", getHighestRatedTutorController);



export default feedbackRouter;