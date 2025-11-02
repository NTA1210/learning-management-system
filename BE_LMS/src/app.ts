import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Role } from "./types";
import { uploadFile } from "./utils/uploadFile";

//config
import upload from "./config/multer";

//constants
import { OK } from "./constants/http";
import { APP_ORIGIN } from "./constants/env";

//middleware
import {
  authenticate,
  customResponse,
  authorize,
  errorHandler,
} from "./middleware";

//routes
import {
  assignmentRoutes,
  authRoutes,
  courseRoutes,
  enrollmentRoutes,
  quizQuestionRoutes,
  sessionRoutes,
  submissionRoutes,
  userRoutes,
} from "./routes";
import {majorProtectedRoutes, majorPublicRoutes} from "@/routes/major.route";
import {specialistProtectedRoutes, specialistPublicRoutes} from "@/routes/specialist.route";

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: APP_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(customResponse);

  //example API----------------------------------
  app.get("/", (req, res) => {
    res.status(OK).send("Hello World!");
  });

  app.post("/uploadExample", upload.single("file"), async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const result = await uploadFile(file);
    res.status(200).json(result);
  });
  //-----------------------------------------------

  //auth routes
  app.use("/auth", authRoutes);

  //public routes
  app.use("/courses", courseRoutes);
  app.use("/assignments", assignmentRoutes);
  app.use("/submissions", submissionRoutes);
  app.use("/majors", majorPublicRoutes);
  app.use("/specialists", specialistPublicRoutes);

  //protected routes
  app.use("/users", authenticate, userRoutes);
  app.use("/sessions", authenticate, authorize(Role.ADMIN), sessionRoutes);
  app.use("/enrollments", authenticate, enrollmentRoutes);
  app.use("/majors", authenticate, authorize(Role.ADMIN), majorProtectedRoutes);
  app.use("/specialists", authenticate, authorize(Role.ADMIN), specialistProtectedRoutes);
  app.use("/quiz-questions", authenticate, quizQuestionRoutes);

  app.use(errorHandler);

  return app;
};
