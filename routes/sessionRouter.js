import e from "express";
import { CreateSession } from "../controllers/sessionController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const sessionRouter = e.Router();

sessionRouter.post("/create",authenticateToken,CreateSession);



export default sessionRouter;