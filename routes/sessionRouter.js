import express from "express";
import { 
    CreateSession, 
    startSession, 
    endSession, 
    cancelSession, 
    getSessionById,
    attendSession,
    getSessionAttendees,
    getStudentAttendanceHistory
} from "../controllers/sessionController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const sessionRouter = express.Router();

// Specific routes (defined before parameterized :id routes)
sessionRouter.post("/create", authenticateToken, CreateSession);
sessionRouter.get("/student/my-attendance", authenticateToken, getStudentAttendanceHistory);

// Session lifecycle routes
sessionRouter.patch("/:id/start", authenticateToken, startSession);
sessionRouter.patch("/:id/end", authenticateToken, endSession);
sessionRouter.patch("/:id/cancel", authenticateToken, cancelSession);

// Attendance routes
sessionRouter.post("/:id/attend", authenticateToken, attendSession);
sessionRouter.get("/:id/attendees", authenticateToken, getSessionAttendees);

// Details route
sessionRouter.get("/:id", authenticateToken, getSessionById);

export default sessionRouter;