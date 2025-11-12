import { SubjectModel, CourseModel, UserModel } from "../models";
import appAssert from "../utils/appAssert";
import { CONFLICT, NOT_FOUND, FORBIDDEN } from "../constants/http";
import { ISubject, Role } from "@/types";
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


/**
 * Helper function: Kiểm tra quyền truy cập subject
 * - Admin: có quyền truy cập tất cả
 * - Teacher: chỉ có quyền truy cập các subject mà họ phụ trách (specialistIds trùng nhau)
 */
const checkSubjectPermission = async (
  subject: any,
  userId: string,
  userRole: Role
): Promise<void> => {
  // Admin có quyền truy cập tất cả
  if (userRole === Role.ADMIN) {
    return;
  }

  // Nếu không phải teacher thì không có quyền
  appAssert(userRole === Role.TEACHER, FORBIDDEN, "Only admin and teacher can access this resource");

  // Lấy thông tin user để kiểm tra specialistIds
  const user = await UserModel.findById(userId).lean();
  appAssert(user, NOT_FOUND, "User not found");

  const userSpecialistIds = (user.specialistIds || []).map((id: any) => id.toString());

  // Nếu teacher không có specialistIds thì không có quyền
  appAssert(
    userSpecialistIds.length > 0,
    FORBIDDEN,
    "Teacher must be assigned to at least one specialist"
  );

  // Kiểm tra xem teacher có specialistIds trùng với subject không
  const subjectSpecialistIds = (subject.specialistIds || []).map((id: any) => id.toString());

  const hasAccess = userSpecialistIds.some((userSpecId: string) =>
    subjectSpecialistIds.includes(userSpecId)
  );

  appAssert(
    hasAccess,
    FORBIDDEN,
    "You can only manage subjects assigned to your specialists"
  );
};

/**
 * Nghiệp vụ: Tạo mới Subject.
 * - Chặn trùng name/slug/code.
 * - Kiểm tra quyền: Admin có thể tạo bất kỳ, Teacher chỉ có thể tạo subject với specialistIds mà họ phụ trách.
 */
export const createSubject = async (
  data: Omit<ISubject, keyof mongoose.Document<mongoose.Types.ObjectId>>,
  userId: string,
  userRole: Role
) => {
  // Kiểm tra quyền: Teacher chỉ có thể tạo subject với specialistIds mà họ phụ trách
  if (userRole === Role.TEACHER) {
    const user = await UserModel.findById(userId).lean();
    appAssert(user, NOT_FOUND, "User not found");
    const userSpecialistIds = (user.specialistIds || []).map((id: any) => id.toString());
    appAssert(
      userSpecialistIds.length > 0,
      FORBIDDEN,
      "Teacher must be assigned to at least one specialist"
    );

    // Kiểm tra xem tất cả specialistIds trong data có thuộc về teacher không
    const dataSpecialistIds = (data.specialistIds || []).map((id: any) => id.toString());
    const allAssigned = dataSpecialistIds.every((specId: string) =>
      userSpecialistIds.includes(specId)
    );

    appAssert(
      allAssigned || dataSpecialistIds.length === 0,
      FORBIDDEN,
      "You can only create subjects with specialists you are assigned to"
    );
  }

  const existingByName = await SubjectModel.findOne({ name: data.name });
  appAssert(!existingByName, CONFLICT, "Subject with this name already exists");

  if (data.slug) {
    const existingBySlug = await SubjectModel.findOne({ slug: data.slug });
    appAssert(!existingBySlug, CONFLICT, "Subject with this slug already exists");
  }

  if (data.code) {
    const existingByCode = await SubjectModel.findOne({ code: data.code });
    appAssert(!existingByCode, CONFLICT, "Subject with this code already exists");
  }

  return await SubjectModel.create(data);
};

/**
 * Nghiệp vụ: Cập nhật Subject theo ID.
 * - Kiểm tra xung đột name/slug/code.
 * - Kiểm tra quyền: Admin có thể cập nhật tất cả, Teacher chỉ có thể cập nhật subject mà họ phụ trách.
 */
export const updateSubjectById = async (
  subjectId: string,
  data: Partial<ISubject>,
  userId: string,
  userRole: Role
) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  // Nếu teacher cập nhật specialistIds, kiểm tra quyền
  if (userRole === Role.TEACHER && data.specialistIds) {
    const user = await UserModel.findById(userId).lean();
    appAssert(user, NOT_FOUND, "User not found");
    const userSpecialistIds = (user.specialistIds || []).map((id: any) => id.toString());
    const dataSpecialistIds = (data.specialistIds || []).map((id: any) => id.toString());
    const allAssigned = dataSpecialistIds.every((specId: string) =>
      userSpecialistIds.includes(specId)
    );
    appAssert(
      allAssigned || dataSpecialistIds.length === 0,
      FORBIDDEN,
      "You can only assign specialists you are assigned to"
    );
  }

  if (data.name && data.name !== subject.name) {
    const existingByName = await SubjectModel.findOne({ name: data.name });
    appAssert(!existingByName, CONFLICT, "Subject with this name already exists");
  }

  if (data.slug && data.slug !== subject.slug) {
    const existingBySlug = await SubjectModel.findOne({ slug: data.slug });
    appAssert(!existingBySlug, CONFLICT, "Subject with this slug already exists");
  }

  if (data.code && data.code !== subject.code) {
    const existingByCode = await SubjectModel.findOne({ code: data.code });
    appAssert(!existingByCode, CONFLICT, "Subject with this code already exists");
  }

  Object.assign(subject, { ...data, updatedAt: new Date() });
  await subject.save();
  return subject;
};

/**
 * Nghiệp vụ: Cập nhật Subject theo slug.
 * - Kiểm tra xung đột name/slug/code.
 * - Kiểm tra quyền: Admin có thể cập nhật tất cả, Teacher chỉ có thể cập nhật subject mà họ phụ trách.
 */
export const updateSubjectBySlug = async (
  slug: string,
  data: Partial<ISubject>,
  userId: string,
  userRole: Role
) => {
  const subject = await SubjectModel.findOne({ slug });
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  // Nếu teacher cập nhật specialistIds, kiểm tra quyền
  if (userRole === Role.TEACHER && data.specialistIds) {
    const user = await UserModel.findById(userId).lean();
    appAssert(user, NOT_FOUND, "User not found");
    const userSpecialistIds = (user.specialistIds || []).map((id: any) => id.toString());
    const dataSpecialistIds = (data.specialistIds || []).map((id: any) => id.toString());
    const allAssigned = dataSpecialistIds.every((specId: string) =>
      userSpecialistIds.includes(specId)
    );
    appAssert(
      allAssigned || dataSpecialistIds.length === 0,
      FORBIDDEN,
      "You can only assign specialists you are assigned to"
    );
  }

  if (data.name && data.name !== subject.name) {
    const existingByName = await SubjectModel.findOne({ name: data.name });
    appAssert(!existingByName, CONFLICT, "Subject with this name already exists");
  }

  if (data.slug && data.slug !== subject.slug) {
    const existingBySlug = await SubjectModel.findOne({ slug: data.slug });
    appAssert(!existingBySlug, CONFLICT, "Subject with this slug already exists");
  }

  if (data.code && data.code !== subject.code) {
    const existingByCode = await SubjectModel.findOne({ code: data.code });
    appAssert(!existingByCode, CONFLICT, "Subject with this code already exists");
  }

  Object.assign(subject, { ...data, updatedAt: new Date() });
  await subject.save();
  return subject;
};

/**
 * Nghiệp vụ: Xóa Subject theo ID.
 * - Chặn xóa nếu đang được Course sử dụng.
 * - Kiểm tra quyền: Admin có thể xóa tất cả, Teacher chỉ có thể xóa subject mà họ phụ trách.
 */
export const deleteSubjectById = async (subjectId: string, userId: string, userRole: Role) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  const coursesUsing = await CourseModel.countDocuments({ subjectId });
  appAssert(
    coursesUsing === 0,
    CONFLICT,
    `Cannot delete subject. ${coursesUsing} course${coursesUsing > 1 ? "s are" : " is"} using this subject.`
  );

  return SubjectModel.deleteOne({ _id: subjectId });
};

/**
 * Nghiệp vụ: Xóa Subject theo slug.
 * - Chặn xóa nếu đang được Course sử dụng.
 * - Kiểm tra quyền: Admin có thể xóa tất cả, Teacher chỉ có thể xóa subject mà họ phụ trách.
 */
export const deleteSubjectBySlug = async (slug: string, userId: string, userRole: Role) => {
  const subject = await SubjectModel.findOne({ slug });
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  const coursesUsing = await CourseModel.countDocuments({ subjectId: subject.id });
  appAssert(
    coursesUsing === 0,
    CONFLICT,
    `Cannot delete subject. ${coursesUsing} course${coursesUsing > 1 ? "s are" : " is"} using this subject.`
  );

  return SubjectModel.deleteOne({ slug });
};

/**
 * Nghiệp vụ: Bật trạng thái hoạt động cho Subject.
 * - Kiểm tra quyền: Admin có thể bật tất cả, Teacher chỉ có thể bật subject mà họ phụ trách.
 */
export const activateSubjectById = async (subjectId: string, userId: string, userRole: Role) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  subject.isActive = true;
  subject.updatedAt = new Date();
  await subject.save();
  return subject;
};

/**
 * Nghiệp vụ: Tắt trạng thái hoạt động cho Subject.
 * - Kiểm tra quyền: Admin có thể tắt tất cả, Teacher chỉ có thể tắt subject mà họ phụ trách.
 */
export const deactivateSubjectById = async (subjectId: string, userId: string, userRole: Role) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  subject.isActive = false;
  subject.updatedAt = new Date();
  await subject.save();
  return subject;
};

/**
 * Nghiệp vụ: Thêm danh sách môn tiên quyết cho Subject.
 * - Bỏ qua các ID đã tồn tại.
 * - Chặn self-reference.
 * - Kiểm tra quyền: Admin có thể thêm tất cả, Teacher chỉ có thể thêm cho subject mà họ phụ trách.
 */
export const addPrerequisites = async (subjectId: string, prerequisiteIds: string[], userId: string, userRole: Role) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  const toAdd = prerequisiteIds
    .filter((id) => id && id !== subjectId)
    .map((id) => new mongoose.Types.ObjectId(id));
  const set = new Set([...(subject.prerequisites || [] as any)].map((x: any) => x.toString()));
  for (const oid of toAdd) {
    if (!set.has(oid.toString())) (subject.prerequisites as any) = [...(subject.prerequisites || [] as any), oid];
  }
  subject.updatedAt = new Date();
  await subject.save();
  return subject.toObject();
};

/**
 * Nghiệp vụ: Gỡ một môn tiên quyết khỏi Subject.
 * - Kiểm tra quyền: Admin có thể gỡ tất cả, Teacher chỉ có thể gỡ cho subject mà họ phụ trách.
 */
export const removePrerequisite = async (subjectId: string, prerequisiteId: string, userId: string, userRole: Role) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  // Kiểm tra quyền
  await checkSubjectPermission(subject, userId, userRole);

  const target = new mongoose.Types.ObjectId(prerequisiteId);
  subject.prerequisites = (subject.prerequisites || []).filter((x: any) => !x.equals(target));
  subject.updatedAt = new Date();
  await subject.save();
  return subject.toObject();
};
