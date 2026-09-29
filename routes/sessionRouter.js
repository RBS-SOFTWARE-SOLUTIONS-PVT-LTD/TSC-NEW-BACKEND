import express from "express";
import { 
    CreateSession, 
    startSession, 
    endSession, 
    cancelSession, 
    getSessionById 
} from "../controllers/sessionController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const sessionRouter = express.Router();

// Session lifecycle routes
sessionRouter.post("/create", authenticateToken, CreateSession);
sessionRouter.patch("/:id/start", authenticateToken, startSession);
sessionRouter.patch("/:id/end", authenticateToken, endSession);
sessionRouter.patch("/:id/cancel", authenticateToken, cancelSession);
sessionRouter.get("/:id", authenticateToken, getSessionById);

export default sessionRouter;