import {Router} from "express";
import {
    getCategoryByIdHandler, listCategoriesHandler, getCategoryBySlugHandler
} from "../controller/category.controller";

const categoryRoutes = Router();

// prefix: /categories

// Public routes
// GET /categories - List all categories with pagination and filters
categoryRoutes.get("/", listCategoriesHandler);

// GET /categories/:id - Get categoriy detail by ID
// categoryRoutes.get("/:id", getCategoryByIdHandler);
categoryRoutes.get("/:slug", getCategoryBySlugHandler);
categoryRoutes.get("/id/:id", getCategoryByIdHandler);

export default categoryRoutes;