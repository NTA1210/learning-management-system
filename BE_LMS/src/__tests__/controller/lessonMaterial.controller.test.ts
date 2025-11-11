// LessonMaterial Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";

jest.mock("@/services/lessonMaterial.service", () => ({
  getLessonMaterials: jest.fn(),
  getLessonMaterialsByLesson: jest.fn(),
  getLessonMaterialById: jest.fn(),
  createLessonMaterial: jest.fn(),
  updateLessonMaterial: jest.fn(),
  deleteLessonMaterial: jest.fn(),
  uploadLessonMaterial: jest.fn(),
  getMaterialForDownload: jest.fn(),
}));

jest.mock("@/utils/uploadFile", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url"),
}));

jest.mock("@/validators/lessonMaterial.shemas", () => ({
  LessonMaterialQuerySchema: { parse: jest.fn() },
  LessonMaterialsByLessonSchema: { parse: jest.fn() },
  LessonMaterialByIdSchema: { parse: jest.fn() },
  CreateLessonMaterialSchema: { parse: jest.fn() },
  UpdateLessonMaterialSchema: { parse: jest.fn() },
  UploadMaterialSchema: { parse: jest.fn() },
}));

import * as service from "@/services/lessonMaterial.service";
import * as schemas from "@/validators/lessonMaterial.shemas";
import {
  listAllLessonMaterialsController,
  getLessonMaterialsByLessonController,
  getLessonMaterialByIdController,
  createLessonMaterialController,
  updateLessonMaterialController,
  deleteLessonMaterialController,
  uploadLessonMaterialController,
  downloadLessonMaterialController,
} from "@/controller/lessonMaterial.controller";

describe("📎 LessonMaterial Controller Unit Tests", () => {
  let req: Partial<Request> & any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { userId: new mongoose.Types.ObjectId(), role: "ADMIN", params: {}, query: {}, body: {}, files: undefined, file: undefined } as any;
    res = { success: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("listAllLessonMaterialsController", () => {
    it("returns paginated data", async () => {
    (schemas.LessonMaterialQuerySchema.parse as jest.Mock).mockReturnValue({ page: 1, limit: 10 });
    (service.getLessonMaterials as jest.Mock).mockResolvedValue({ materials: [{ _id: "1" }], pagination: { page: 1, limit: 10, total: 1 } });
    await listAllLessonMaterialsController(req as Request, res as Response, next);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: [{ _id: "1" }],
        message: "Get all lesson materials successfully",
        pagination: { page: 1, limit: 10, total: 1 }
      });
    });

    it("handles validation errors", async () => {
      const validationError = new Error("Validation failed");
      (schemas.LessonMaterialQuerySchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await listAllLessonMaterialsController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      (schemas.LessonMaterialQuerySchema.parse as jest.Mock).mockReturnValue({ page: 1, limit: 10 });
      const serviceError = new Error("Service error");
      (service.getLessonMaterials as jest.Mock).mockRejectedValue(serviceError);
      await listAllLessonMaterialsController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("getLessonMaterialsByLessonController", () => {
    it("works with valid lessonId", async () => {
    const lessonId = new mongoose.Types.ObjectId().toString();
    req.params = { lessonId };
    (schemas.LessonMaterialsByLessonSchema.parse as jest.Mock).mockReturnValue({ lessonId });
    (service.getLessonMaterialsByLesson as jest.Mock).mockResolvedValue([{ _id: "m1" }]);
    await getLessonMaterialsByLessonController(req as Request, res as Response, next);
      expect(service.getLessonMaterialsByLesson).toHaveBeenCalledWith(lessonId, req.userId.toString(), req.role);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: [{ _id: "m1" }],
        message: "Get lesson materials by lesson successfully"
      });
    });

    it("handles invalid lessonId parameter", async () => {
      req.params = { lessonId: "invalid" };
      const validationError = new Error("Invalid lesson ID format");
      (schemas.LessonMaterialsByLessonSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await getLessonMaterialsByLessonController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      (schemas.LessonMaterialsByLessonSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      const serviceError = new Error("Service error");
      (service.getLessonMaterialsByLesson as jest.Mock).mockRejectedValue(serviceError);
      await getLessonMaterialsByLessonController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("getLessonMaterialByIdController", () => {
    it("works with valid id", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    req.params = { id };
    (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
    (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ _id: id });
    await getLessonMaterialByIdController(req as Request, res as Response, next);
    expect(service.getLessonMaterialById).toHaveBeenCalledWith(id, req.userId.toString(), req.role);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { _id: id },
        message: "Get lesson material by id successfully"
      });
    });

    it("handles invalid id parameter", async () => {
      req.params = { id: "invalid" };
      const validationError = new Error("Invalid material ID format");
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await getLessonMaterialByIdController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      const serviceError = new Error("Service error");
      (service.getLessonMaterialById as jest.Mock).mockRejectedValue(serviceError);
      await getLessonMaterialByIdController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("createLessonMaterialController", () => {
    it("works with valid data", async () => {
    const data = { lessonId: new mongoose.Types.ObjectId().toString(), title: "Doc" };
    req.body = data;
    (schemas.CreateLessonMaterialSchema.parse as jest.Mock).mockReturnValue(data);
    (service.createLessonMaterial as jest.Mock).mockResolvedValue({ _id: "1", ...data });
    await createLessonMaterialController(req as Request, res as Response, next);
      expect(service.createLessonMaterial).toHaveBeenCalledWith(data, req.userId.toString(), req.role);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { _id: "1", ...data },
        message: "Create lesson material successfully"
      });
    });

    it("handles validation errors", async () => {
      req.body = { title: "" }; // Invalid data
      const validationError = new Error("Validation failed");
      (schemas.CreateLessonMaterialSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await createLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const data = { lessonId: new mongoose.Types.ObjectId().toString(), title: "Doc" };
      req.body = data;
      (schemas.CreateLessonMaterialSchema.parse as jest.Mock).mockReturnValue(data);
      const serviceError = new Error("Service error");
      (service.createLessonMaterial as jest.Mock).mockRejectedValue(serviceError);
      await createLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("updateLessonMaterialController", () => {
    it("works with valid data", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    req.params = { id };
    req.body = { title: "New" };
    (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
    (schemas.UpdateLessonMaterialSchema.parse as jest.Mock).mockReturnValue({ title: "New" });
    (service.updateLessonMaterial as jest.Mock).mockResolvedValue({ _id: id, title: "New" });
    await updateLessonMaterialController(req as Request, res as Response, next);
      expect(service.updateLessonMaterial).toHaveBeenCalledWith(id, { title: "New" }, req.userId.toString(), req.role);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { _id: id, title: "New" },
        message: "Update lesson material successfully"
      });
    });

    it("handles validation errors for id", async () => {
      req.params = { id: "invalid" };
      const validationError = new Error("Invalid material ID format");
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await updateLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles validation errors for body", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.body = { title: "" };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      const validationError = new Error("Validation failed");
      (schemas.UpdateLessonMaterialSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await updateLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.body = { title: "New" };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      (schemas.UpdateLessonMaterialSchema.parse as jest.Mock).mockReturnValue({ title: "New" });
      const serviceError = new Error("Service error");
      (service.updateLessonMaterial as jest.Mock).mockRejectedValue(serviceError);
      await updateLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("deleteLessonMaterialController", () => {
    it("works with valid id", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    req.params = { id };
    (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
    (service.deleteLessonMaterial as jest.Mock).mockResolvedValue({ _id: id });
    await deleteLessonMaterialController(req as Request, res as Response, next);
      expect(service.deleteLessonMaterial).toHaveBeenCalledWith(id, req.userId.toString(), req.role);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { _id: id },
        message: "Delete lesson material successfully"
      });
    });

    it("handles invalid id parameter", async () => {
      req.params = { id: "invalid" };
      const validationError = new Error("Invalid material ID format");
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await deleteLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      const serviceError = new Error("Service error");
      (service.deleteLessonMaterial as jest.Mock).mockRejectedValue(serviceError);
      await deleteLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("uploadLessonMaterialController", () => {
    it("works with single file", async () => {
    const lessonId = new mongoose.Types.ObjectId().toString();
    req.files = [{ size: 10 }];
    req.body = { lessonId, title: "T", type: "pdf" };
    (schemas.UploadMaterialSchema.parse as jest.Mock).mockReturnValue({ lessonId, title: "T", type: "pdf" });
    (service.uploadLessonMaterial as jest.Mock).mockResolvedValue({ _id: "1" });
    await uploadLessonMaterialController(req as Request, res as Response, next);
    expect(service.uploadLessonMaterial).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { _id: "1" },
        message: "Upload lesson material successfully"
      });
    });

    it("works with multiple files", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.files = [{ size: 10 }, { size: 20 }];
      req.body = { lessonId, title: "T", type: "pdf" };
      (schemas.UploadMaterialSchema.parse as jest.Mock).mockReturnValue({ lessonId, title: "T", type: "pdf" });
      (service.uploadLessonMaterial as jest.Mock).mockResolvedValue([{ _id: "1" }, { _id: "2" }]);
      await uploadLessonMaterialController(req as Request, res as Response, next);
      expect(service.uploadLessonMaterial).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(200, {
        data: [{ _id: "1" }, { _id: "2" }],
        message: "Uploaded 2 material(s) successfully"
      });
    });

    it("works with req.file (fallback)", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.file = { size: 10 } as any;
      req.body = { lessonId, title: "T", type: "pdf" };
      (schemas.UploadMaterialSchema.parse as jest.Mock).mockReturnValue({ lessonId, title: "T", type: "pdf" });
      (service.uploadLessonMaterial as jest.Mock).mockResolvedValue({ _id: "1" });
      await uploadLessonMaterialController(req as Request, res as Response, next);
      expect(service.uploadLessonMaterial).toHaveBeenCalled();
    });

    it("returns 400 when no file uploaded", async () => {
      req.files = undefined;
      req.file = undefined;
      await uploadLessonMaterialController(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "No file uploaded"
      });
    });

    it("handles validation errors", async () => {
      req.files = [{ size: 10 }];
      req.body = { lessonId: "invalid" };
      const validationError = new Error("Validation failed");
      (schemas.UploadMaterialSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await uploadLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.files = [{ size: 10 }];
      req.body = { lessonId, title: "T", type: "pdf" };
      (schemas.UploadMaterialSchema.parse as jest.Mock).mockReturnValue({ lessonId, title: "T", type: "pdf" });
      const serviceError = new Error("Service error");
      (service.uploadLessonMaterial as jest.Mock).mockRejectedValue(serviceError);
      await uploadLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("downloadLessonMaterialController", () => {
    it("success flow with file", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ hasAccess: true });
      (service.getMaterialForDownload as jest.Mock).mockResolvedValue({ 
        _id: id, 
        key: "files/a.pdf", 
        originalName: "a.pdf",
        lessonId: new mongoose.Types.ObjectId(),
        title: "Test",
        note: "Note",
        mimeType: "application/pdf",
        size: 100,
        uploadedBy: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await downloadLessonMaterialController(req as Request, res as Response, next);
      expect(res.success).toHaveBeenCalled();
    });

    it("returns 403 when user has no access", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ hasAccess: false });
      await downloadLessonMaterialController(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You don't have permission to download this material"
      });
    });

    it("returns 404 when material is manual (no file)", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ hasAccess: true });
      (service.getMaterialForDownload as jest.Mock).mockResolvedValue({ 
        _id: id, 
        key: "manual-materials/test",
        originalName: null
      });
      await downloadLessonMaterialController(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "This material does not have a file to download"
      });
    });

    it("returns 404 when material has no key", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ hasAccess: true });
      (service.getMaterialForDownload as jest.Mock).mockResolvedValue({ 
        _id: id, 
        key: null,
        originalName: null
      });
      await downloadLessonMaterialController(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "This material does not have a file to download"
      });
    });

    it("handles validation errors", async () => {
      req.params = { id: "invalid" };
      const validationError = new Error("Invalid material ID format");
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await downloadLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors from getLessonMaterialById", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      const serviceError = new Error("Service error");
      (service.getLessonMaterialById as jest.Mock).mockRejectedValue(serviceError);
      await downloadLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });

    it("handles service errors from getMaterialForDownload", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
      (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ hasAccess: true });
      const serviceError = new Error("Service error");
      (service.getMaterialForDownload as jest.Mock).mockRejectedValue(serviceError);
      await downloadLessonMaterialController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });
});








