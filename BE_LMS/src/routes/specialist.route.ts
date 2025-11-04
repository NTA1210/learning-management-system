import {Router} from "express";
import {
    getSpecialistByIdHandler,
    listSpecialistsHandler,
    getSpecialistBySlugHandler,
    createSpecialistHandler,
    updateSpecialistByIdHandler,
    updateSpecialistBySlugHandler,
    deleteSpecialistByIdHandler,
    deleteSpecialistBySlugHandler,
} from "../controller/specialist.controller";

const specialistPublicRoutes = Router();
const specialistProtectedRoutes = Router();

// prefix: /specialists

// Public routes
// GET /specialists - List all specialists with pagination and filters
specialistPublicRoutes.get("/", listSpecialistsHandler);

// GET /specialists/:slug - Get specialist detail by slug
specialistPublicRoutes.get("/:slug", getSpecialistBySlugHandler);

// GET /specialists/id/:id - Get specialist detail by ID
specialistPublicRoutes.get("/id/:id", getSpecialistByIdHandler);

// Protected routes
// POST /specialists - Create a new specialist
specialistProtectedRoutes.post("/", createSpecialistHandler);

// PATCH /specialists/:slug - Update specialist by slug
specialistProtectedRoutes.patch("/:slug", updateSpecialistBySlugHandler);

// PATCH /specialists/id/:id - Update specialist by ID
specialistProtectedRoutes.patch("/id/:id", updateSpecialistByIdHandler);

// DELETE /specialists/:slug - Delete specialist by slug
specialistProtectedRoutes.delete("/:slug", deleteSpecialistBySlugHandler);

// DELETE /specialists/id/:id - Delete specialist by ID
specialistProtectedRoutes.delete("/id/:id", deleteSpecialistByIdHandler);

export {specialistPublicRoutes, specialistProtectedRoutes};