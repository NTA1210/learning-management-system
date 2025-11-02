import {Router} from "express";
import {
    getMajorByIdHandler,
    listMajorsHandler,
    getMajorBySlugHandler,
    createMajorHandler,
    updateMajorByIdHandler,
    updateMajorBySlugHandler,
    deleteMajorByIdHandler,
    deleteMajorBySlugHandler,
} from "../controller/major.controller";

const majorPublicRoutes = Router();
const majorProtectedRoutes = Router();

// prefix: /majors

// Public routes
// GET /majors - List all majors with pagination and filters
majorPublicRoutes.get("/", listMajorsHandler);

// GET /majors/:slug - Get major detail by slug
majorPublicRoutes.get("/:slug", getMajorBySlugHandler);

// GET /majors/id/:id - Get major detail by ID
majorPublicRoutes.get("/id/:id", getMajorByIdHandler);

// Protected routes
// POST /majors - Create a new major
majorProtectedRoutes.post("/", createMajorHandler);

// PATCH /majors/:slug - Update major by slug
majorProtectedRoutes.patch("/:slug", updateMajorBySlugHandler);

// PATCH /majors/id/:id - Update major by ID
majorProtectedRoutes.patch("/id/:id", updateMajorByIdHandler);

// DELETE /majors/:slug - Delete major by slug
majorProtectedRoutes.delete("/:slug", deleteMajorBySlugHandler);

// DELETE /majors/id/:id - Delete major by ID
majorProtectedRoutes.delete("/id/:id", deleteMajorByIdHandler);

export {majorPublicRoutes, majorProtectedRoutes};