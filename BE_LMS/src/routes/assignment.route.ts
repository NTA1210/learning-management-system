import { Router } from "express";
import {
  listAssignmentsHandler,
  getAssignmentByIdHandler,
  createAssignmentHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
} from "../controller/assignment.controller";

const assignmentRoutes = Router();

// prefix: /assignments

// Public routes
assignmentRoutes.get("/", listAssignmentsHandler);
assignmentRoutes.get("/:id", getAssignmentByIdHandler);

// Protected routes (cần authentication)
assignmentRoutes.post("/", createAssignmentHandler);
assignmentRoutes.put("/:id", updateAssignmentHandler);
assignmentRoutes.delete("/:id", deleteAssignmentHandler);

export default assignmentRoutes;