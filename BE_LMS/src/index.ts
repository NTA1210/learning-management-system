import express from "express";
import connectToDatabase from "./config/db";
import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import { OK } from "./constants/http";

// Import all models to register schemas
import "./models/user.model";
import "./models/session.model";
import "./models/verificationCode.model";
import "./models/course.model";
import "./models/category.model";
import "./models/enrollment.model";
import "./models/lesson.model";
import "./models/lessonMaterial.model";
import "./models/assignment.model";
import "./models/submission.model";
import "./models/quiz.model";
import "./models/quizAttempt.model";
import "./models/forum.model";
import "./models/forumPost.model";
import "./models/forumReply.model";
import "./models/announcement.model";
import "./models/attendance.model";
import "./models/notification.model";

import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";
import courseRoutes from "./routes/course.route";
import assignmentRoutes from "./routes/assignment.route";
import submissionRoutes from "./routes/submission.route";

import { customResponse } from "./middleware/customResponse";


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

app.get("/", (req, res) => {
  res.status(OK).send("Hello World!");
});

//auth routes
app.use("/auth", authRoutes);

//public routes
app.use("/courses", courseRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/submissions", submissionRoutes);

//protected routes
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT} in ${NODE_ENV} environment`);
  await connectToDatabase();
});
