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
  listPrerequisites,
  searchSubjectsAutocomplete,
  getRelatedSubjects,
 
} from "../services/subject.service";

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
  return res.success(OK, { message: "Subject retrieved successfully", data: subject });
});

// GET /subjects/:slug - Lấy chi tiết Subject theo slug
export const getSubjectBySlugHandler = catchErrors(async (req, res) => {
  const slug = subjectSlugSchema.parse(req.params.slug);
  const subject = await getSubjectBySlug(slug);
  return res.success(OK, { message: "Subject retrieved successfully", data: subject });
});

// GET /subjects/id/:id/prerequisites - Danh sách môn tiên quyết của Subject
export const listPrerequisitesHandler = catchErrors(async (req, res) => {
  const { subjectId } = listPrerequisitesSchema.parse({ subjectId: req.params.id });
  const items = await listPrerequisites(subjectId);
  return res.success(OK, { message: "Prerequisites retrieved successfully", data: items });
});

// GET /subjects/autocomplete/search - Gợi ý search nhanh theo name/code/slug
export const autocompleteSubjectsHandler = catchErrors(async (req, res) => {
  const query = autocompleteSchema.parse(req.query);
  const items = await searchSubjectsAutocomplete(query.q || "", query.limit);
  return res.success(OK, { message: "Subjects autocomplete successfully", data: items });
});

// GET /subjects/id/:id/related - Gợi ý Subject liên quan (specialist chung, liên hệ prerequisites)
export const relatedSubjectsHandler = catchErrors(async (req, res) => {
  const params = relatedSubjectsSchema.parse({ id: req.params.id, limit: req.query.limit as any });
  const items = await getRelatedSubjects(params.id, params.limit);
  return res.success(OK, { message: "Related subjects retrieved successfully", data: items });
});




