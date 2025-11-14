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

const subjectRouter = Router();

// prefix: /subjects

// Protected routes (require authentication)
// GET /subjects - List Subject (search/lọc/phân trang)
subjectRouter.get("/", listSubjectsHandler);
// GET /subjects/:slug - Chi tiết Subject theo slug
subjectRouter.get("/:slug",  getSubjectBySlugHandler);
// GET /subjects/id/:id - Chi tiết Subject theo ID
subjectRouter.get("/id/:id", getSubjectByIdHandler);
// GET /subjects/id/:id/prerequisites - Danh sách môn tiên quyết
subjectRouter.get("/id/:id/prerequisites",  listPrerequisitesHandler);
// GET /subjects/autocomplete/search - Autocomplete theo name/code/slug
subjectRouter.get("/autocomplete/search", autocompleteSubjectsHandler);
// GET /subjects/id/:id/related - Gợi ý môn liên quan
subjectRouter.get("/id/:id/related", relatedSubjectsHandler);
// GET /subjects/export - Export JSON danh sách Subject
// subjectRouter.get("/export", authenticate, exportSubjectsHandler);

// Protected routes (require authentication + admin/teacher role)
// POST /subjects - Tạo Subject (Admin/Teacher only)
subjectRouter.post("/",  authorize(Role.ADMIN, Role.TEACHER), createSubjectHandler);
// PATCH /subjects/:slug - Cập nhật theo slug (Admin/Teacher only)
subjectRouter.patch("/:slug", authorize(Role.ADMIN, Role.TEACHER), updateSubjectBySlugHandler);
// PATCH /subjects/id/:id - Cập nhật theo ID (Admin/Teacher only)
subjectRouter.patch("/id/:id",  authorize(Role.ADMIN, Role.TEACHER), updateSubjectByIdHandler);
// DELETE /subjects/:slug - Xóa theo slug (Admin/Teacher only)
subjectRouter.delete("/:slug",  authorize(Role.ADMIN, Role.TEACHER), deleteSubjectBySlugHandler);
// DELETE /subjects/id/:id - Xóa theo ID (Admin/Teacher only)
subjectRouter.delete("/id/:id",  authorize(Role.ADMIN, Role.TEACHER), deleteSubjectByIdHandler);
// PATCH /subjects/id/:id/activate - Bật isActive (Admin/Teacher only)
subjectRouter.patch("/id/:id/activate",  authorize(Role.ADMIN, Role.TEACHER), activateSubjectHandler);
// PATCH /subjects/id/:id/deactivate - Tắt isActive (Admin/Teacher only)
subjectRouter.patch("/id/:id/deactivate",  authorize(Role.ADMIN, Role.TEACHER), deactivateSubjectHandler);
// POST /subjects/id/:id/prerequisites - Thêm prerequisites (Admin/Teacher only)
subjectRouter.post("/id/:id/prerequisites",  authorize(Role.ADMIN, Role.TEACHER), addPrerequisitesHandler);
// DELETE /subjects/id/:id/prerequisites/:preId - Gỡ một prerequisite (Admin/Teacher only)
subjectRouter.delete("/id/:id/prerequisites/:preId", authorize(Role.ADMIN, Role.TEACHER), removePrerequisiteHandler);
// // POST /subjects/import - Import JSON (hỗ trợ dry-run)
// subjectRouter.post("/import", authenticate, authorize(Role.ADMIN, Role.TEACHER), importSubjectsHandler);

export default subjectRouter;



