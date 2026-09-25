import e from "express"
import { getAllUsers, Login, SignUp } from "../controllers/userController.js";

const UserRouter = e.Router();


UserRouter.post("/signup", SignUp);
UserRouter.get("/users", getAllUsers);
UserRouter.post("/login", Login);

export default UserRouter;