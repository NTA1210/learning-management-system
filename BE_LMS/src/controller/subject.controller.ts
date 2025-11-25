import { catchErrors } from "../utils/asyncHandler";
import mongoose from "mongoose";
import { OK, CREATED } from "../constants/http";
import {
  listSubjectsSchema,
  subjectIdSchema,
  subjectSlugSchema,
  createSubjectSchema,
  updateSubjectSchema,
  subjectActivateSchema,
  addPrerequisitesSchema,
  removePrerequisiteSchema,
  listPrerequisitesSchema,
  autocompleteSchema,
  relatedSubjectsSchema,
} from "../validators/subject.schemas";
import {
  listSubjects,
  getSubjectById,
  getSubjectBySlug,
  createSubject,
  updateSubjectById,
  updateSubjectBySlug,
  deleteSubjectById,
  deleteSubjectBySlug,
  activateSubjectById,
  deactivateSubjectById,
  addPrerequisites,
  removePrerequisite,
  listPrerequisites,
  searchSubjectsAutocomplete,
  getRelatedSubjects,
  deleteQuestionsBySubjectId,
  getMySubjects,
} from "../services/subject.service";

/**
 * GET /subjects/my-subjects - Get my subjects
 */
export const getMySubjectsHandler = catchErrors(async (req, res) => {
  const query = listSubjectsSchema.parse(req.query);
  const userId = (req as any).userId;
  const userRole = (req as any).role;

  const result = await getMySubjects({
    userId,
    userRole,
    params: {
      page: query.page,
      limit: query.limit,
      search: query.search,
      name: query.name,
      slug: query.slug,
      code: query.code,
      specialistId: query.specialistId,
      isActive: query.isActive,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });

  return res.success(OK, {
    data: result.subjects,
    message: "My subjects retrieved successfully",
    pagination: result.pagination,
  });
});

// GET /subjects - Liệt kê Subject (search, lọc, phân trang, sắp xếp)
export const listSubjectsHandler = catchErrors(async (req, res) => {
  const query = listSubjectsSchema.parse(req.query);

  const result = await listSubjects({
    page: query.page,
    limit: query.limit,
    search: query.search,
    name: query.name,
    slug: query.slug,
    code: query.code,
    specialistId: query.specialistId,
    isActive: query.isActive,
    createdAt: query.createdAt,
    updatedAt: query.updatedAt,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return res.success(OK, {
    message: "Subjects retrieved successfully",
    data: result.subjects,
    pagination: result.pagination,
  });
});

// GET /subjects/id/:id - Lấy chi tiết Subject theo ID
export const getSubjectByIdHandler = catchErrors(async (req, res) => {
  const id = subjectIdSchema.parse(req.params.id);
  const subject = await getSubjectById(id);
  return res.success(OK, {
    message: "Subject retrieved successfully",
    data: subject,
  });
});

// GET /subjects/:slug - Lấy chi tiết Subject theo slug
export const getSubjectBySlugHandler = catchErrors(async (req, res) => {
  const slug = subjectSlugSchema.parse(req.params.slug);
  const subject = await getSubjectBySlug(slug);
  return res.success(OK, {
    message: "Subject retrieved successfully",
    data: subject,
  });
});

// POST /subjects - Tạo mới Subject (chống trùng name/slug/code)
export const createSubjectHandler = catchErrors(async (req, res) => {
  const data = createSubjectSchema.parse(req.body);
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const payload = {
    ...data,
    specialistIds:
      data.specialistIds?.map(
        (id: string) => new mongoose.Types.ObjectId(id)
      ) ?? [],
    prerequisites:
      data.prerequisites?.map(
        (id: string) => new mongoose.Types.ObjectId(id)
      ) ?? [],
  };
  const subject = await createSubject(payload as any, userId, userRole);
  return res.success(CREATED, {
    message: "Subject created successfully",
    data: subject,
  });
});

// PATCH /subjects/id/:id - Cập nhật Subject theo ID (kiểm tra xung đột)
export const updateSubjectByIdHandler = catchErrors(async (req, res) => {
  const id = subjectIdSchema.parse(req.params.id);
  const data = updateSubjectSchema.parse(req.body);
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const payload = {
    ...data,
    specialistIds: data.specialistIds?.map(
      (v: string) => new mongoose.Types.ObjectId(v)
    ),
    prerequisites: data.prerequisites?.map(
      (v: string) => new mongoose.Types.ObjectId(v)
    ),
  };
  const subject = await updateSubjectById(id, payload as any, userId, userRole);
  return res.success(OK, {
    message: "Subject updated successfully",
    data: subject,
  });
});

// PATCH /subjects/:slug - Cập nhật Subject theo slug (kiểm tra xung đột)
export const updateSubjectBySlugHandler = catchErrors(async (req, res) => {
  const slug = subjectSlugSchema.parse(req.params.slug);
  const data = updateSubjectSchema.parse(req.body);
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const payload = {
    ...data,
    specialistIds: data.specialistIds?.map(
      (v: string) => new mongoose.Types.ObjectId(v)
    ),
    prerequisites: data.prerequisites?.map(
      (v: string) => new mongoose.Types.ObjectId(v)
    ),
  };
  const subject = await updateSubjectBySlug(
    slug,
    payload as any,
    userId,
    userRole
  );
  return res.success(OK, {
    message: "Subject updated successfully",
    data: subject,
  });
});

// DELETE /subjects/id/:id - Xóa Subject theo ID (chặn nếu Course đang dùng)
export const deleteSubjectByIdHandler = catchErrors(async (req, res) => {
  const id = subjectIdSchema.parse(req.params.id);
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const result = await deleteSubjectById(id, userId, userRole);
  return res.success(OK, {
    message: "Subject deleted successfully",
    data: result,
  });
});

// DELETE /subjects/:slug - Xóa Subject theo slug (chặn nếu Course đang dùng)
export const deleteSubjectBySlugHandler = catchErrors(async (req, res) => {
  const slug = subjectSlugSchema.parse(req.params.slug);
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const result = await deleteSubjectBySlug(slug, userId, userRole);
  return res.success(OK, {
    message: "Subject deleted successfully",
    data: result,
  });
});

// PATCH /subjects/id/:id/activate - Bật trạng thái hoạt động cho Subject
export const activateSubjectHandler = catchErrors(async (req, res) => {
  const { id } = subjectActivateSchema.parse({ id: req.params.id });
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const subject = await activateSubjectById(id, userId, userRole);
  return res.success(OK, {
    message: "Subject activated successfully",
    data: subject,
  });
});

// PATCH /subjects/id/:id/deactivate - Tắt trạng thái hoạt động cho Subject
export const deactivateSubjectHandler = catchErrors(async (req, res) => {
  const { id } = subjectActivateSchema.parse({ id: req.params.id });
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const subject = await deactivateSubjectById(id, userId, userRole);
  return res.success(OK, {
    message: "Subject deactivated successfully",
    data: subject,
  });
});

// POST /subjects/id/:id/prerequisites - Thêm danh sách môn tiên quyết (chặn vòng lặp)
export const addPrerequisitesHandler = catchErrors(async (req, res) => {
  const body = addPrerequisitesSchema.parse({
    subjectId: req.params.id,
    prerequisiteIds: req.body.prerequisiteIds,
  });
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const subject = await addPrerequisites(
    body.subjectId,
    body.prerequisiteIds,
    userId,
    userRole
  );
  return res.success(OK, {
    message: "Prerequisites added successfully",
    data: subject,
  });
});

// DELETE /subjects/id/:id/prerequisites/:preId - Gỡ một môn tiên quyết
export const removePrerequisiteHandler = catchErrors(async (req, res) => {
  const params = removePrerequisiteSchema.parse({
    subjectId: req.params.id,
    prerequisiteId: req.params.preId,
  });
  const userId = (req as any).userId;
  const userRole = (req as any).role;
  const subject = await removePrerequisite(
    params.subjectId,
    params.prerequisiteId,
    userId,
    userRole
  );
  return res.success(OK, {
    message: "Prerequisite removed successfully",
    data: subject,
  });
});

// GET /subjects/id/:id/prerequisites - Danh sách môn tiên quyết của Subject
export const listPrerequisitesHandler = catchErrors(async (req, res) => {
  const { subjectId } = listPrerequisitesSchema.parse({
    subjectId: req.params.id,
  });
  const items = await listPrerequisites(subjectId);
  return res.success(OK, {
    message: "Prerequisites retrieved successfully",
    data: items,
  });
});

// GET /subjects/autocomplete/search - Gợi ý search nhanh theo name/code/slug
export const autocompleteSubjectsHandler = catchErrors(async (req, res) => {
  const query = autocompleteSchema.parse(req.query);
  const items = await searchSubjectsAutocomplete(query.q || "", query.limit);
  return res.success(OK, {
    message: "Subjects autocomplete successfully",
    data: items,
  });
});

// GET /subjects/id/:id/related - Gợi ý Subject liên quan (specialist chung, liên hệ prerequisites)
export const relatedSubjectsHandler = catchErrors(async (req, res) => {
  const params = relatedSubjectsSchema.parse({
    id: req.params.id,
    limit: req.query.limit as any,
  });
  const items = await getRelatedSubjects(params.id, params.limit);
  return res.success(OK, {
    message: "Related subjects retrieved successfully",
    data: items,
  });
});

// // POST /subjects/import - Import JSON danh sách Subject (hỗ trợ dry-run)
// export const importSubjectsHandler = catchErrors(async (req, res) => {
//   const body = importSubjectsSchema.parse(req.body);
//   const report = await importSubjects(body.items as any, body.dryRun);
//   return res.success(OK, { message: body.dryRun ? "Import dry-run report" : "Subjects imported successfully", data: report });
// });

// // GET /subjects/export - Export JSON danh sách Subject theo filter
// export const exportSubjectsHandler = catchErrors(async (req, res) => {
//   const query = exportSubjectsSchema.parse(req.query);
//   const data = await exportSubjects(query as any);
//   return res.success(OK, { message: "Subjects exported successfully", data });
// });

// DELETE /subjects/:subjectId/quiz-questions - Xóa tất cả câu hỏi trắc nghiệm thuộc Subject (Admin only)
export const deleteQuestionsBySubjectIdHandler = catchErrors(
  async (req, res) => {
    const subjectId = subjectIdSchema.parse(req.params.subjectId);

    const { deletedCount } = await deleteQuestionsBySubjectId(subjectId);

    return res.success(OK, {
      deletedCount,
      message: "Quiz questions deleted successfully",
    });
  }
);
