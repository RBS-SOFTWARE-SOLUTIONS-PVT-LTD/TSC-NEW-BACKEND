import e from "express"
import { getAllUsers, SignUp } from "../controllers/userController.js";

const UserRouter = e.Router();


UserRouter.post("/signup", SignUp);
UserRouter.get("/users", getAllUsers);

export default UserRouter;