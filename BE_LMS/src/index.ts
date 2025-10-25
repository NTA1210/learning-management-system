import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Role } from "./types";
import { uploadFile } from "./utils/uploadFile";

//constants
import { OK } from "./constants/http";
import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";

//config
import upload from "./config/multer";
import { ensureBucket } from "./config/minio";
import connectToDatabase from "./config/db";

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
  sessionRoutes,
  submissionRoutes,
  userRoutes,
  categoryRoutes
} from "./routes";

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

//example API
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
app.use("/categories", categoryRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/submissions", submissionRoutes);

//protected routes
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, authorize(Role.ADMIN), sessionRoutes);
app.use("/enrollments", authenticate, enrollmentRoutes);

app.use(errorHandler);

/**
 * Check if the bucket exists and set policy
 * then start the server
 */
function startServer() {
  ensureBucket()
    .then(() => console.log("✅ MinIO initialized"))
    .catch((err) => console.error("⚠️ MinIO not ready:", err));

  app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT} in ${NODE_ENV} environment`);
    await connectToDatabase();
  });
}

startServer();
