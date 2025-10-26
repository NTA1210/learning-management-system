import {Router} from "express";
import {
    getCategoryByIdHandler,
    listCategoriesHandler,
    getCategoryBySlugHandler,
    createCategoryHandler,
    updateCategoryByIdHandler,
    updateCategoryBySlugHandler,
    deleteCategoryByIdHandler,
    deleteCategoryBySlugHandler,
} from "../controller/category.controller";

const categoryRoutes = Router();

// prefix: /categories

// Public routes
// GET /categories - List all categories with pagination and filters
categoryRoutes.get("/", listCategoriesHandler);

// GET /categories/:slug - Get category detail by slug
categoryRoutes.get("/:slug", getCategoryBySlugHandler);

// GET /categories/id/:id - Get category detail by ID
categoryRoutes.get("/id/:id", getCategoryByIdHandler);

// POST /categories - Create a new category
categoryRoutes.post("/", createCategoryHandler);

// PATCH /categories/:slug - Update category by slug
categoryRoutes.patch("/:slug", updateCategoryBySlugHandler);

// PATCH /categories/id/:id - Update category by ID
categoryRoutes.patch("/id/:id", updateCategoryByIdHandler);

// DELETE /categories/:slug - Delete category by slug
categoryRoutes.delete("/:slug", deleteCategoryBySlugHandler);

// DELETE /categories/id/:id - Delete category by ID
categoryRoutes.delete("/id/:id", deleteCategoryByIdHandler);

export default categoryRoutes;