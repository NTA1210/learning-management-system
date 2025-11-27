import { Router } from "express";
import {
  listAssignmentsHandler,
  getAssignmentByIdHandler,
  createAssignmentHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
} from "../controller/assignment.controller";
import { authenticate, authorize } from "@/middleware";
import { Role } from "@/types";
import upload from "@/config/multer";

const assignmentRoutes = Router();

// prefix: /assignments

// Public routes
assignmentRoutes.get("/", authenticate, listAssignmentsHandler);
assignmentRoutes.get("/:id", authenticate, getAssignmentByIdHandler);

// creat assignment
assignmentRoutes.post("/",authenticate,authorize(Role.ADMIN, Role.TEACHER),upload.single("file"),createAssignmentHandler);
// assignmentRoutes.post("/course/:courseId",authenticate,authorize(Role.ADMIN, Role.TEACHER),upload.single("file"),createAssignmentHandler);

assignmentRoutes.put("/:id", authenticate, authorize(Role.ADMIN,Role.TEACHER), updateAssignmentHandler);
assignmentRoutes.delete("/:id", authenticate, authorize(Role.ADMIN,Role.TEACHER), deleteAssignmentHandler);

export default assignmentRoutes;