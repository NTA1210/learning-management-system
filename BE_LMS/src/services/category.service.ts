import CategoryModel from "../models/category.model";
import CourseModel from "../models/course.model";
import appAssert from "../utils/appAssert";
import {NOT_FOUND, CONFLICT} from "../constants/http";

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

export const createCategory = async (data: {
    name: string;
    slug: string;
    description?: string;
}) => {
    // Check if category with same name already exists
    const existingByName = await CategoryModel.findOne({ name: data.name });
    appAssert(!existingByName, CONFLICT, "Category with this name already exists");

    // Check if category with same slug already exists
    const existingBySlug = await CategoryModel.findOne({ slug: data.slug });
    appAssert(!existingBySlug, CONFLICT, "Category with this slug already exists");

    return await CategoryModel.create(data);
};

export const updateCategoryById = async (
    categoryId: string,
    data: {
        name?: string;
        slug?: string;
        description?: string;
    }
) => {
    const category = await CategoryModel.findById(categoryId);
    appAssert(category, NOT_FOUND, "Category not found");

    // If updating name, check for conflicts
    if (data.name && data.name !== category.name) {
        const existingByName = await CategoryModel.findOne({ name: data.name });
        appAssert(!existingByName, CONFLICT, "Category with this name already exists");
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== category.slug) {
        const existingBySlug = await CategoryModel.findOne({ slug: data.slug });
        appAssert(!existingBySlug, CONFLICT, "Category with this slug already exists");
    }

    Object.assign(category, data);
    await category.save();

    return category;
};

export const updateCategoryBySlug = async (
    slug: string,
    data: {
        name?: string;
        slug?: string;
        description?: string;
    }
) => {
    const category = await CategoryModel.findOne({ slug });
    appAssert(category, NOT_FOUND, "Category not found");

    // If updating name, check for conflicts
    if (data.name && data.name !== category.name) {
        const existingByName = await CategoryModel.findOne({ name: data.name });
        appAssert(!existingByName, CONFLICT, "Category with this name already exists");
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== category.slug) {
        const existingBySlug = await CategoryModel.findOne({ slug: data.slug });
        appAssert(!existingBySlug, CONFLICT, "Category with this slug already exists");
    }

    Object.assign(category, data);
    await category.save();

    return category;
};

export const deleteCategoryById = async (categoryId: string) => {
    const category = await CategoryModel.findById(categoryId);
    appAssert(category, NOT_FOUND, "Category not found");

    // Check if any courses are using this category
    const coursesUsingCategory = await CourseModel.countDocuments({ category: categoryId });
    appAssert(
        coursesUsingCategory === 0,
        CONFLICT,
        `Cannot delete category. ${coursesUsingCategory} course(s) are using this category`
    );

    await CategoryModel.findByIdAndDelete(categoryId);
    return category;
};

export const deleteCategoryBySlug = async (slug: string) => {
    const category = await CategoryModel.findOne({ slug });
    appAssert(category, NOT_FOUND, "Category not found");

    // Check if any courses are using this category
    const coursesUsingCategory = await CourseModel.countDocuments({ category: category._id });
    appAssert(
        coursesUsingCategory === 0,
        CONFLICT,
        `Cannot delete category. ${coursesUsingCategory} course(s) are using this category`
    );

    await CategoryModel.findOneAndDelete({ slug });
    return category;
};
