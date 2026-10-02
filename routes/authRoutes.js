import express from "express";
import {registerAdmin,login} from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();


// Login
router.post("/login", login);


// Create another admin
router.post("/admin",registerAdmin);

export default router;

//,authenticateToken