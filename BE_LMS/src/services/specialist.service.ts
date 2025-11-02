import {SpecialistModel, CourseModel, UserModel} from "../models";
import appAssert from "../utils/appAssert";
import {NOT_FOUND, CONFLICT} from "../constants/http";
import {ISpecialist} from "@/types";
import {Role} from "@/types";
import {ListParams} from "@/types/dto";
import mongoose from "mongoose";

export interface ListSpecialistParams extends ListParams {
    name?: string;
    slug?: string;
    description?: string;
    majorId?: string;
    isActive?: boolean;
}

export const listSpecialists = async ({
                                          page,
                                          limit,
                                          search,
                                          name,
                                          slug,
                                          description,
                                          majorId,
                                          createdAt,
                                          updatedAt,
                                          isActive,
                                          sortBy = "createdAt",
                                          sortOrder = "desc",
                                      }: ListSpecialistParams) => {
    // Build filter query
    const filter: any = {};

    // Filter by active status
    if (isActive !== undefined) {
        filter.isActive = isActive;
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

    if (majorId) {
        filter.majorId = majorId;
    }

    if (createdAt) {
        filter.createdAt = createdAt;
    }

    if (updatedAt) {
        filter.updatedAt = updatedAt;
    }

    // Search by title or description (text search)
    if (search) {
        filter.$or = [
            {title: {$regex: search, $options: "i"}},
            {description: {$regex: search, $options: "i"}},
        ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [specialists, total] = await Promise.all([
        SpecialistModel.find(filter)
            .populate("majorId", "name slug description createdAt updatedAt")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        SpecialistModel.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        specialists,
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

export const getSpecialistById = async (specialistId: string) => {
    const specialist = await SpecialistModel.findById(specialistId).lean();

    appAssert(specialist, NOT_FOUND, "Specialist not found");

    return specialist;
};

export const getSpecialistBySlug = async (slug: string) => {
    const specialist = await SpecialistModel.findOne({slug}).lean();

    appAssert(specialist, NOT_FOUND, "Specialist not found");

    return specialist;
}

export const createSpecialist = async (data: Omit<ISpecialist, keyof mongoose.Document<mongoose.Types.ObjectId>>) => {
    // Check if specialist with same name already exists
    const existingByName = await SpecialistModel.findOne({name: data.name});
    appAssert(!existingByName, CONFLICT, "Specialist with this name already exists");

    // Check if specialist with same slug already exists
    const existingBySlug = await SpecialistModel.findOne({slug: data.slug});
    appAssert(!existingBySlug, CONFLICT, "Specialist with this slug already exists");

    return await SpecialistModel.create(data);
};

export const updateSpecialistById = async (
    specialistId: string,
    data: Partial<ISpecialist>,
) => {
    const specialist = await SpecialistModel.findById(specialistId);
    appAssert(specialist, NOT_FOUND, "Specialist not found");

    // If updating name, check for conflicts
    if (data.name && data.name !== specialist.name) {
        const existingByName = await SpecialistModel.findOne({name: data.name});
        appAssert(!existingByName, CONFLICT, "Specialist with this name already exists");
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== specialist.slug) {
        const existingBySlug = await SpecialistModel.findOne({slug: data.slug});
        appAssert(!existingBySlug, CONFLICT, "Specialist with this slug already exists");
    }

    // If updating major, check if the major exists
    if (data.majorId && data.majorId.toString() !== specialist.majorId.toString()) {
        const majorExists = await SpecialistModel.findById(data.majorId);
        appAssert(majorExists, NOT_FOUND, "Major not found");
    }

    Object.assign(specialist, {...data, updatedAt: new Date()});
    await specialist.save();
    return specialist;
};

export const updateSpecialistBySlug = async (
    slug: string,
    data: Partial<ISpecialist>
) => {
    const specialist = await SpecialistModel.findOne({slug});
    appAssert(specialist, NOT_FOUND, "Specialist not found");

    // If updating name, check for conflicts
    if (data.name && data.name !== specialist.name) {
        const existingByName = await SpecialistModel.findOne({name: data.name});
        appAssert(!existingByName, CONFLICT, "Specialist with this name already exists");
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== specialist.slug) {
        const existingBySlug = await SpecialistModel.findOne({slug: data.slug});
        appAssert(!existingBySlug, CONFLICT, "Specialist with this slug already exists");
    }

    // If updating major, check if the major exists
    if (data.majorId && data.majorId.toString() !== specialist.majorId.toString()) {
        const majorExists = await SpecialistModel.findById(data.majorId);
        appAssert(majorExists, NOT_FOUND, "Major not found");
    }

    Object.assign(specialist, {...data, updatedAt: new Date()});
    await specialist.save();
    return specialist;
};

export const deleteSpecialistById = async (specialistId: string) => {
    const specialist = await SpecialistModel.findById(specialistId);
    appAssert(specialist, NOT_FOUND, "Specialist not found");

    // Check if any teachers and courses are using this specialist
    const [teachersUsingSpecialist, coursesUsingSpecialist] = await Promise.all([
        UserModel.countDocuments({role: Role.TEACHER, specialistIds: {$in: specialistId}}),
        CourseModel.countDocuments({specialistIds: {$in: specialistId}}),
    ]);
    appAssert(
        teachersUsingSpecialist === 0 && coursesUsingSpecialist === 0,
        CONFLICT,
        `Cannot delete specialist. ${teachersUsingSpecialist} teacher${teachersUsingSpecialist > 1 && "s"} and ${coursesUsingSpecialist} course${coursesUsingSpecialist > 1 && "s"} ${teachersUsingSpecialist + coursesUsingSpecialist === 1 ? "is" : "are"} using this specialist.`
    );

    return SpecialistModel.deleteOne({_id: specialistId});
};

export const deleteSpecialistBySlug = async (slug: string) => {
    const specialist = await SpecialistModel.findOne({slug});
    appAssert(specialist, NOT_FOUND, "Specialist not found");

    // Check if any teachers and courses are using this specialist
    const [teachersUsingSpecialist, coursesUsingSpecialist] = await Promise.all([
        UserModel.countDocuments({role: Role.TEACHER, specialistIds: {$in: specialist.id}}),
        CourseModel.countDocuments({specialistIds: {$in: specialist.id}}),
    ]);
    appAssert(
        teachersUsingSpecialist === 0 && coursesUsingSpecialist === 0,
        CONFLICT,
        `Cannot delete specialist. ${teachersUsingSpecialist} teacher${teachersUsingSpecialist > 1 && "s"} and ${coursesUsingSpecialist} course${coursesUsingSpecialist > 1 && "s"} ${teachersUsingSpecialist + coursesUsingSpecialist === 1 ? "is" : "are"} using this specialist.`
    );

    return SpecialistModel.deleteOne({slug});
};
