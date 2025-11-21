import { Router } from "express";
import {
  getUserHandler,
  getUserForCourseHandler,
} from "../controller/user.controller";

const userRoutes = Router();

//prefix : /users
userRoutes.get("/me", getUserHandler);
userRoutes.get("/", getUserForCourseHandler);

export default userRoutes;
