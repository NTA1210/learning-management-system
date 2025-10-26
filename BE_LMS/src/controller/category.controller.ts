import {catchErrors} from "../utils/asyncHandler";
import {OK, CREATED} from "../constants/http";
import {
    listCategoriesSchema,
    categoryIdSchema,
    categorySlugSchema,
    createCategorySchema,
    updateCategorySchema,
} from "../validators/category.schemas";
import {
    getCategoryById,
    getCategoryBySlug,
    listCategories,
    createCategory,
    updateCategoryById,
    updateCategoryBySlug,
    deleteCategoryById,
    deleteCategoryBySlug,
} from "../../src/services/category.service";

export const listCategoriesHandler = catchErrors(async (req, res) => {
    // Validate query parameters
    const query = listCategoriesSchema.parse(req.query);

    // Call service
    const result = await listCategories({
        page: query.page,
        limit: query.limit,
        search: query.search,
        name: query.name,
        slug: query.slug,
        description: query.description,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });

    return res.status(OK).json({
        message: "Categories retrieved successfully",
        data: result.categories,
        pagination: result.pagination,
    });
});

export const getCategoryByIdHandler = catchErrors(async (req, res) => {
    const courseId = categoryIdSchema.parse(req.params.id);

    // Call service
    const category = await getCategoryById(courseId);

    return res.status(OK).json({
        message: "Category retrieved successfully",
        data: category,
    });
});

export const getCategoryBySlugHandler = catchErrors(async (req, res) => {
    const courseSlug = categorySlugSchema.parse(req.params.slug);

    // Call service
    const category = await getCategoryBySlug(courseSlug);

    return res.status(OK).json({
        message: "Category retrieved successfully",
        data: category,
    });
});

export const createCategoryHandler = catchErrors(async (req, res) => {
    const data = createCategorySchema.parse(req.body);

    // Call service
    const category = await createCategory(data);

    return res.status(CREATED).json({
        message: "Category created successfully",
        data: category,
    });
});

export const updateCategoryByIdHandler = catchErrors(async (req, res) => {
    const categoryId = categoryIdSchema.parse(req.params.id);
    const data = updateCategorySchema.parse(req.body);

    // Call service
    const category = await updateCategoryById(categoryId, data);

    return res.status(OK).json({
        message: "Category updated successfully",
        data: category,
    });
});

export const updateCategoryBySlugHandler = catchErrors(async (req, res) => {
    const slug = categorySlugSchema.parse(req.params.slug);
    const data = updateCategorySchema.parse(req.body);

    // Call service
    const category = await updateCategoryBySlug(slug, data);

    return res.status(OK).json({
        message: "Category updated successfully",
        data: category,
    });
});

export const deleteCategoryByIdHandler = catchErrors(async (req, res) => {
    const categoryId = categoryIdSchema.parse(req.params.id);

    // Call service
    const category = await deleteCategoryById(categoryId);

    return res.status(OK).json({
        message: "Category deleted successfully",
        data: category,
    });
});

export const deleteCategoryBySlugHandler = catchErrors(async (req, res) => {
    const slug = categorySlugSchema.parse(req.params.slug);

    // Call service
    const category = await deleteCategoryBySlug(slug);

    return res.status(OK).json({
        message: "Category deleted successfully",
        data: category,
    });
});
