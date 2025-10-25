import {catchErrors} from "../utils/asyncHandler";
import {OK} from "../constants/http";
import {
    listCategoriesSchema,
    categoryIdSchema, categorySlugSchema,
} from "../validators/category.schemas";
import {getCategoryById, getCategoryBySlug, listCategories} from "../../src/services/category.service";

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

