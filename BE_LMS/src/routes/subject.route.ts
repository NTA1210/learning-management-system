import { Router } from "express";
import {
  listSubjectsHandler,
  getSubjectBySlugHandler,
  getSubjectByIdHandler,
  listPrerequisitesHandler,
  autocompleteSubjectsHandler,
  relatedSubjectsHandler,
} from "../controller/subject.controller";

const subjectRouter = Router();

// prefix: /subjects

// Public
// GET /subjects - List Subject (search/lọc/phân trang)
subjectRouter.get("/", listSubjectsHandler);
// GET /subjects/:slug - Chi tiết Subject theo slug
subjectRouter.get("/:slug", getSubjectBySlugHandler);
// GET /subjects/id/:id - Chi tiết Subject theo ID
subjectRouter.get("/id/:id", getSubjectByIdHandler);
// GET /subjects/id/:id/prerequisites - Danh sách môn tiên quyết
subjectRouter.get("/id/:id/prerequisites", listPrerequisitesHandler);
// GET /subjects/autocomplete/search - Autocomplete theo name/code/slug
subjectRouter.get("/autocomplete/search", autocompleteSubjectsHandler);
// GET /subjects/id/:id/related - Gợi ý môn liên quan
subjectRouter.get("/id/:id/related", relatedSubjectsHandler);
// GET /subjects/export - Export JSON danh sách Subject
// subjectPublicRoutes.get("/export", exportSubjectsHandler);



export { subjectRouter };



