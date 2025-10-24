import CategoryModel from "../models/category.model";
import appAssert from "../utils/appAssert";
import {NOT_FOUND} from "../constants/http";

export type ListCategoryParams = {
    page: number;
    limit: number;
    search?: string;
    name?: string;
    slug?: string;
    description?: string;
    sortBy?: string;
    sortOrder?: string;
};

export const listCategories = async ({
                                         page,
                                         limit,
                                         search,
                                         name,
                                         slug,
                                         description,
                                         sortBy = "createdAt",
                                         sortOrder = "desc",
                                     }: ListCategoryParams) => {
    // Build filter query
    const filter: any = {};

    // Search by title or description (text search)
    if (search) {
        filter.$or = [
            {title: {$regex: search, $options: "i"}},
            {description: {$regex: search, $options: "i"}},
        ];
    }

    if (name) {
        filter.name = name;
    }

    if (slug) {
        filter.slug = slug;
    }

    if (description) {
        filter.description = description;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [categories, total] = await Promise.all([
        CategoryModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        CategoryModel.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        categories,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    };
};

export const getCategoryById = async (categoryId: string) => {
    const category = await CategoryModel.findById(categoryId).lean();

    appAssert(category, NOT_FOUND, "Category not found");

    return category;
};

export const getCategoryBySlug = async (slug: string) => {
    const category = await CategoryModel.findOne({slug}).lean();

    appAssert(category, NOT_FOUND, "Category not found");

    return category;
}