import { Router } from "express";
import {
  listSubjectsHandler,
  getSubjectBySlugHandler,
  getSubjectByIdHandler,
  listPrerequisitesHandler,
  autocompleteSubjectsHandler,
  relatedSubjectsHandler,
} from "../controller/subject.controller";

const subjectPublicRoutes = Router();
const subjectProtectedRoutes = Router();

// prefix: /subjects

// Public
// GET /subjects - List Subject (search/lọc/phân trang)
subjectPublicRoutes.get("/", listSubjectsHandler);
// GET /subjects/:slug - Chi tiết Subject theo slug
subjectPublicRoutes.get("/:slug", getSubjectBySlugHandler);
// GET /subjects/id/:id - Chi tiết Subject theo ID
subjectPublicRoutes.get("/id/:id", getSubjectByIdHandler);
// GET /subjects/id/:id/prerequisites - Danh sách môn tiên quyết
subjectPublicRoutes.get("/id/:id/prerequisites", listPrerequisitesHandler);
// GET /subjects/autocomplete/search - Autocomplete theo name/code/slug
subjectPublicRoutes.get("/autocomplete/search", autocompleteSubjectsHandler);
// GET /subjects/id/:id/related - Gợi ý môn liên quan
subjectPublicRoutes.get("/id/:id/related", relatedSubjectsHandler);
// GET /subjects/export - Export JSON danh sách Subject
// subjectPublicRoutes.get("/export", exportSubjectsHandler);



export { subjectPublicRoutes, subjectProtectedRoutes };



