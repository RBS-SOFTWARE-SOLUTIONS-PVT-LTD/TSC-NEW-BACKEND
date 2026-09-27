import express from "express";
import { submitFeedback } from "../controllers/feedbackController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {authMiddlewaretemp} from "../middlewares/authMiddlewareTEMP.js";

const feedbackRouter = express.Router();

feedbackRouter.post("/feedback", authMiddlewaretemp, submitFeedback);

export default feedbackRouter;