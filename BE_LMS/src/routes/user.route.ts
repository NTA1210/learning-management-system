import { Router } from "express";
import { getUserHandler, getUsersHandler } from "../controller/user.controller";

const userRoutes = Router();

//prefix : /user
userRoutes.get("/:courseId", getUsersHandler);
userRoutes.get("/me", getUserHandler);

export default userRoutes;
