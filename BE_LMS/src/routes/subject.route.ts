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

const subjectRoutes = Router();

// prefix: /subjects

// Protected routes (require authentication)
// GET /subjects - List Subject (search/lọc/phân trang)
subjectRoutes.get("/", listSubjectsHandler);
// GET /subjects/id/:id - Chi tiết Subject theo ID
subjectRoutes.get("/:id", getSubjectByIdHandler);
// GET /subjects/:slug - Chi tiết Subject theo slug
subjectRoutes.get("/slug/:slug",  getSubjectBySlugHandler);
// GET /subjects/id/:id/prerequisites - Danh sách môn tiên quyết
subjectRoutes.get("/:id/prerequisites",  listPrerequisitesHandler);
// GET /subjects/autocomplete/search - Autocomplete theo name/code/slug
subjectRoutes.get("/autocomplete/search", autocompleteSubjectsHandler);
// GET /subjects/id/:id/related - Gợi ý môn liên quan
subjectRoutes.get("/:id/related", relatedSubjectsHandler);
// GET /subjects/export - Export JSON danh sách Subject
// subjectRouter.get("/export", authenticate, exportSubjectsHandler);

// Protected routes (require authentication + admin/teacher role)
// POST /subjects - Tạo Subject (Admin/Teacher only)
subjectRoutes.post("/",  authorize(Role.ADMIN, Role.TEACHER), createSubjectHandler);
// PATCH /subjects/:slug - Cập nhật theo slug (Admin/Teacher only)
subjectRoutes.patch("/slug/:slug", authorize(Role.ADMIN, Role.TEACHER), updateSubjectBySlugHandler);
// PATCH /subjects/id/:id - Cập nhật theo ID (Admin/Teacher only)
subjectRoutes.patch("/:id",  authorize(Role.ADMIN, Role.TEACHER), updateSubjectByIdHandler);
// DELETE /subjects/:slug - Xóa theo slug (Admin/Teacher only)
subjectRoutes.delete("/slug/:slug",  authorize(Role.ADMIN, Role.TEACHER), deleteSubjectBySlugHandler);
// DELETE /subjects/id/:id - Xóa theo ID (Admin/Teacher only)
subjectRoutes.delete("/:id",  authorize(Role.ADMIN, Role.TEACHER), deleteSubjectByIdHandler);
// PATCH /subjects/id/:id/activate - Bật isActive (Admin/Teacher only)
subjectRoutes.patch("/:id/activate",  authorize(Role.ADMIN, Role.TEACHER), activateSubjectHandler);
// PATCH /subjects/id/:id/deactivate - Tắt isActive (Admin/Teacher only)
subjectRoutes.patch("/:id/deactivate",  authorize(Role.ADMIN, Role.TEACHER), deactivateSubjectHandler);
// POST /subjects/id/:id/prerequisites - Thêm prerequisites (Admin/Teacher only)
subjectRoutes.post("/:id/prerequisites",  authorize(Role.ADMIN, Role.TEACHER), addPrerequisitesHandler);
// DELETE /subjects/id/:id/prerequisites/:preId - Gỡ một prerequisite (Admin/Teacher only)
subjectRoutes.delete("/:id/prerequisites/:preId", authorize(Role.ADMIN, Role.TEACHER), removePrerequisiteHandler);
// // POST /subjects/import - Import JSON (hỗ trợ dry-run)
// subjectRouter.post("/import", authenticate, authorize(Role.ADMIN, Role.TEACHER), importSubjectsHandler);

export default subjectRoutes;



