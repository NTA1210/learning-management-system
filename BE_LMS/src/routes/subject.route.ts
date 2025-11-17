import { Router } from "express";
import {
  listSubjectsHandler,
  getSubjectBySlugHandler,
  getSubjectByIdHandler,
  createSubjectHandler,
  updateSubjectBySlugHandler,
  updateSubjectByIdHandler,
  deleteSubjectBySlugHandler,
  deleteSubjectByIdHandler,
  activateSubjectHandler,
  deactivateSubjectHandler,
  addPrerequisitesHandler,
  removePrerequisiteHandler,
  listPrerequisitesHandler,
  autocompleteSubjectsHandler,
  relatedSubjectsHandler,

} from "../controller/subject.controller";
import authenticate from "../middleware/authenticate";
import authorize from "../middleware/authorize";
import { Role } from "../types";

const subjectRouters = Router();

// prefix: /subjects

// Protected routes (require authentication)
// GET /subjects - List Subject (search/lọc/phân trang)
subjectRouters.get("/", listSubjectsHandler);
// GET /subjects/id/:id - Chi tiết Subject theo ID
subjectRouters.get("/:id", getSubjectByIdHandler);
// GET /subjects/:slug - Chi tiết Subject theo slug
subjectRouters.get("/:slug",  getSubjectBySlugHandler);
// GET /subjects/id/:id/prerequisites - Danh sách môn tiên quyết
subjectRouters.get("/:id/prerequisites",  listPrerequisitesHandler);
// GET /subjects/autocomplete/search - Autocomplete theo name/code/slug
subjectRouters.get("/autocomplete/search", autocompleteSubjectsHandler);
// GET /subjects/id/:id/related - Gợi ý môn liên quan
subjectRouters.get("/:id/related", relatedSubjectsHandler);
// GET /subjects/export - Export JSON danh sách Subject
// subjectRouter.get("/export", authenticate, exportSubjectsHandler);

// Protected routes (require authentication + admin/teacher role)
// POST /subjects - Tạo Subject (Admin/Teacher only)
subjectRouters.post("/",  authorize(Role.ADMIN, Role.TEACHER), createSubjectHandler);
// PATCH /subjects/:slug - Cập nhật theo slug (Admin/Teacher only)
subjectRouters.patch("/:slug", authorize(Role.ADMIN, Role.TEACHER), updateSubjectBySlugHandler);
// PATCH /subjects/id/:id - Cập nhật theo ID (Admin/Teacher only)
subjectRouters.patch("/:id",  authorize(Role.ADMIN, Role.TEACHER), updateSubjectByIdHandler);
// DELETE /subjects/:slug - Xóa theo slug (Admin/Teacher only)
subjectRouters.delete("/:slug",  authorize(Role.ADMIN, Role.TEACHER), deleteSubjectBySlugHandler);
// DELETE /subjects/id/:id - Xóa theo ID (Admin/Teacher only)
subjectRouters.delete("/:id",  authorize(Role.ADMIN, Role.TEACHER), deleteSubjectByIdHandler);
// PATCH /subjects/id/:id/activate - Bật isActive (Admin/Teacher only)
subjectRouters.patch("/:id/activate",  authorize(Role.ADMIN, Role.TEACHER), activateSubjectHandler);
// PATCH /subjects/id/:id/deactivate - Tắt isActive (Admin/Teacher only)
subjectRouters.patch("/:id/deactivate",  authorize(Role.ADMIN, Role.TEACHER), deactivateSubjectHandler);
// POST /subjects/id/:id/prerequisites - Thêm prerequisites (Admin/Teacher only)
subjectRouters.post("/:id/prerequisites",  authorize(Role.ADMIN, Role.TEACHER), addPrerequisitesHandler);
// DELETE /subjects/id/:id/prerequisites/:preId - Gỡ một prerequisite (Admin/Teacher only)
subjectRouters.delete("/:id/prerequisites/:preId", authorize(Role.ADMIN, Role.TEACHER), removePrerequisiteHandler);
// // POST /subjects/import - Import JSON (hỗ trợ dry-run)
// subjectRouter.post("/import", authenticate, authorize(Role.ADMIN, Role.TEACHER), importSubjectsHandler);

export default subjectRouters;



