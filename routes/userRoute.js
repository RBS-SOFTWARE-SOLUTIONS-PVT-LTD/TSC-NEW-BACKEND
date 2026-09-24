import e from "express"
import { SignUp } from "../controllers/userController.js";

const UserRouter = e.Router();


UserRouter.post("/signup", SignUp);

export default UserRouter;