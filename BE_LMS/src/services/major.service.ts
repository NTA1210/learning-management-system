import {MajorModel, SpecialistModel} from "../models";
import appAssert from "../utils/appAssert";
import {NOT_FOUND, CONFLICT} from "../constants/http";
import {IMajor} from "@/types";
import {ListParams} from "@/types/dto";
import mongoose from "mongoose";

export interface ListMajorParams extends ListParams {
    name?: string;
    slug?: string;
    description?: string;
}

export const listMajors = async ({
                                     page,
                                     limit,
                                     search,
                                     name,
                                     slug,
                                     description,
                                     createdAt,
                                     updatedAt,
                                     sortBy = "createdAt",
                                     sortOrder = "desc",
                                 }: ListMajorParams) => {
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

    if (createdAt) {
        filter.createdAt = createdAt;
    }

    if (updatedAt) {
        filter.updatedAt = updatedAt;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [majors, total] = await Promise.all([
        MajorModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        MajorModel.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        majors,
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

export const getMajorById = async (majorId: string) => {
    const major = await MajorModel.findById(majorId).lean();

    appAssert(major, NOT_FOUND, "Major not found");

    return major;
};

export const getMajorBySlug = async (slug: string) => {
    const major = await MajorModel.findOne({slug}).lean();

    appAssert(major, NOT_FOUND, "Major not found");

    return major;
}

export const createMajor = async (data: Omit<IMajor, keyof mongoose.Document<mongoose.Types.ObjectId>>) => {
    // Check if major with same name already exists
    const existingByName = await MajorModel.findOne({name: data.name});
    appAssert(!existingByName, CONFLICT, "Major with this name already exists");

    // Check if major with same slug already exists
    if (data.slug) {
        const existingBySlug = await MajorModel.findOne({slug: data.slug});
        appAssert(!existingBySlug, CONFLICT, "Major with this slug already exists");
    }

    return await MajorModel.create(data);
};

export const updateMajorById = async (
    majorId: string,
    data: Partial<IMajor>
) => {
    const major = await MajorModel.findById(majorId);
    appAssert(major, NOT_FOUND, "Major not found");

    // If updating name, check for conflicts
    if (data.name && data.name !== major.name) {
        const existingByName = await MajorModel.findOne({name: data.name});
        appAssert(!existingByName, CONFLICT, "Major with this name already exists");
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== major.slug) {
        const existingBySlug = await MajorModel.findOne({slug: data.slug});
        appAssert(!existingBySlug, CONFLICT, "Major with this slug already exists");
    }

    Object.assign(major, {...data, updatedAt: new Date()});
    await major.save();
    return major;
};

export const updateMajorBySlug = async (
    slug: string,
    data: Partial<IMajor>
) => {
    const major = await MajorModel.findOne({slug});
    appAssert(major, NOT_FOUND, "Major not found");

    // If updating name, check for conflicts
    if (data.name && data.name !== major.name) {
        const existingByName = await MajorModel.findOne({name: data.name});
        appAssert(!existingByName, CONFLICT, "Major with this name already exists");
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== major.slug) {
        const existingBySlug = await MajorModel.findOne({slug: data.slug});
        appAssert(!existingBySlug, CONFLICT, "Major with this slug already exists");
    }

    Object.assign(major, {...data, updatedAt: new Date()});
    await major.save();
    return major;
};

export const deleteMajorById = async (majorId: string) => {
    const major = await MajorModel.findById(majorId);
    appAssert(major, NOT_FOUND, "Major not found");

    // Check if any specialist are using this major
    const specialistsUsingMajor = await SpecialistModel.countDocuments({major: majorId});
    appAssert(
        specialistsUsingMajor === 0,
        CONFLICT,
        `Cannot delete major. ${specialistsUsingMajor} specialist${specialistsUsingMajor > 1 ? "s are" : " is"} using this major.`
    );

    return MajorModel.deleteOne({_id: majorId});
};

export const deleteMajorBySlug = async (slug: string) => {
    const major = await MajorModel.findOne({slug});
    appAssert(major, NOT_FOUND, "Major not found");

    // Check if any specialist are using this major
    const specialistsUsingMajor = await SpecialistModel.countDocuments({major: major.id});
    appAssert(
        specialistsUsingMajor === 0,
        CONFLICT,
        `Cannot delete major. ${specialistsUsingMajor} specialist${specialistsUsingMajor > 1 && "s"} are using this major.`
    );

    return MajorModel.deleteOne({slug: slug});
};
