import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
  sendPasswordResetHandler,
  verifyEmailHandler,
} from "../controller/auth.controller";

const appRoutes = Router();

//prefix: /auth

appRoutes.post("/register", registerHandler);
appRoutes.post("/login", loginHandler);
appRoutes.get("/logout", logoutHandler);
appRoutes.get("/refresh", refreshHandler);
appRoutes.get("/email/verify/:code", verifyEmailHandler);
appRoutes.post("/password/forgot", sendPasswordResetHandler);

export const authRoutes = appRoutes;

export default appRoutes;
