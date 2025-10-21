import express from "express";
import connectToDatabase from "./config/db";
import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import { OK } from "./constants/http";
import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";
import enrollmentRoutes from "./routes/enrollment.route";
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

//protected routes
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);
app.use("/enrollments", authenticate, enrollmentRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT} in ${NODE_ENV} environment`);
  await connectToDatabase();
});
