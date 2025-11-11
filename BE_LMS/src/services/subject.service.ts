import { SubjectModel, CourseModel } from "../models";
import appAssert from "../utils/appAssert";
import { CONFLICT, NOT_FOUND } from "../constants/http";
import { ISubject } from "@/types";
import { ListParams } from "@/types/dto";
import mongoose from "mongoose";

export interface ListSubjectParams extends ListParams {
  name?: string;
  slug?: string;
  code?: string;
  specialistId?: string;
  isActive?: string | boolean;
}

/**
 * Nghiệp vụ: Liệt kê danh sách Subject với phân trang, lọc và sắp xếp.
 * - Search full-text theo name/description nếu có index text.
 * - Lọc theo name/slug/code/isActive/specialistId.
 * - Trả kèm thông tin phân trang.
 */
export const listSubjects = async ({
  page,
  limit,
  search,
  name,
  slug,
  code,
  specialistId,
  isActive,
  createdAt,
  updatedAt,
  sortBy = "createdAt",
  sortOrder = "desc",
}: ListSubjectParams) => {
  const filter: any = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (name) filter.name = name;
  if (slug) filter.slug = slug;
  if (code) filter.code = code;

  if (typeof isActive !== "undefined") {
    const val = typeof isActive === "string" ? isActive === "true" : !!isActive;
    filter.isActive = val;
  }

  if (specialistId) {
    filter.specialistIds = new mongoose.Types.ObjectId(specialistId);
  }

  if (createdAt) filter.createdAt = createdAt;
  if (updatedAt) filter.updatedAt = updatedAt;

  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [subjects, total] = await Promise.all([
    SubjectModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    SubjectModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    subjects,
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

/**
 * Nghiệp vụ: Lấy chi tiết Subject theo ID.
 * - Trả 404 nếu không tồn tại.
 */
export const getSubjectById = async (subjectId: string) => {
  const subject = await SubjectModel.findById(subjectId).lean();
  appAssert(subject, NOT_FOUND, "Subject not found");
  return subject;
};

/**
 * Nghiệp vụ: Lấy chi tiết Subject theo slug.
 * - Trả 404 nếu không tồn tại.
 */
export const getSubjectBySlug = async (slug: string) => {
  const subject = await SubjectModel.findOne({ slug }).lean();
  appAssert(subject, NOT_FOUND, "Subject not found");
  return subject;
};



/**
 * Nghiệp vụ: Danh sách môn tiên quyết của một Subject (populate tối thiểu).
 */
export const listPrerequisites = async (subjectId: string) => {
  const subject = await SubjectModel.findById(subjectId)
    .populate("prerequisites", "name code slug credits isActive")
    .lean();
  appAssert(subject, NOT_FOUND, "Subject not found");
  return subject.prerequisites || [];
};

/**
 * Nghiệp vụ: Gợi ý search nhanh cho Subject (autocomplete).
 */
export const searchSubjectsAutocomplete = async (query: string, limit = 10) => {
  const filter: any = {};
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { code: { $regex: query, $options: "i" } },
      { slug: { $regex: query, $options: "i" } },
    ];
  }
  const items = await SubjectModel.find(filter)
    .select("name code slug credits isActive")
    .limit(limit)
    .lean();
  return items;
};

/**
 * Nghiệp vụ: Lấy danh sách Subject liên quan
 * - Dựa trên specialistIds chung hoặc quan hệ prerequisites ngược/thuận.
 */
export const getRelatedSubjects = async (subjectId: string, limit = 10) => {
  const subject = await SubjectModel.findById(subjectId).lean();
  appAssert(subject, NOT_FOUND, "Subject not found");
  const specialistIds = (subject.specialistIds || []).map((id: any) => new mongoose.Types.ObjectId(id));
  const related = await SubjectModel.find({
    _id: { $ne: subject._id },
    $or: [
      { specialistIds: { $in: specialistIds } },
      { prerequisites: subject._id },
      { _id: { $in: subject.prerequisites || [] } },
    ],
  })
    .select("name code slug credits isActive specialistIds")
    .limit(limit)
    .lean();
  return related;
};



