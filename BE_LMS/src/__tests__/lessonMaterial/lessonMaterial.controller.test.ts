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
    req = { userId: new mongoose.Types.ObjectId(), role: "ADMIN", params: {}, query: {}, body: {} } as any;
    res = { success: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("listAllLessonMaterialsController returns paginated data", async () => {
    (schemas.LessonMaterialQuerySchema.parse as jest.Mock).mockReturnValue({ page: 1, limit: 10 });
    (service.getLessonMaterials as jest.Mock).mockResolvedValue({ materials: [{ _id: "1" }], pagination: { page: 1, limit: 10, total: 1 } });
    await listAllLessonMaterialsController(req as Request, res as Response, next);
    expect(res.success).toHaveBeenCalled();
  });

  it("getLessonMaterialsByLessonController works", async () => {
    const lessonId = new mongoose.Types.ObjectId().toString();
    req.params = { lessonId };
    (schemas.LessonMaterialsByLessonSchema.parse as jest.Mock).mockReturnValue({ lessonId });
    (service.getLessonMaterialsByLesson as jest.Mock).mockResolvedValue([{ _id: "m1" }]);
    await getLessonMaterialsByLessonController(req as Request, res as Response, next);
    expect(service.getLessonMaterialsByLesson).toHaveBeenCalled();
  });

  it("getLessonMaterialByIdController works", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    req.params = { id };
    (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
    (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ _id: id });
    await getLessonMaterialByIdController(req as Request, res as Response, next);
    expect(service.getLessonMaterialById).toHaveBeenCalledWith(id, req.userId.toString(), req.role);
  });

  it("createLessonMaterialController works", async () => {
    const data = { lessonId: new mongoose.Types.ObjectId().toString(), title: "Doc" };
    req.body = data;
    (schemas.CreateLessonMaterialSchema.parse as jest.Mock).mockReturnValue(data);
    (service.createLessonMaterial as jest.Mock).mockResolvedValue({ _id: "1", ...data });
    await createLessonMaterialController(req as Request, res as Response, next);
    expect(service.createLessonMaterial).toHaveBeenCalled();
  });

  it("updateLessonMaterialController works", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    req.params = { id };
    req.body = { title: "New" };
    (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
    (schemas.UpdateLessonMaterialSchema.parse as jest.Mock).mockReturnValue({ title: "New" });
    (service.updateLessonMaterial as jest.Mock).mockResolvedValue({ _id: id, title: "New" });
    await updateLessonMaterialController(req as Request, res as Response, next);
    expect(service.updateLessonMaterial).toHaveBeenCalled();
  });

  it("deleteLessonMaterialController works", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    req.params = { id };
    (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
    (service.deleteLessonMaterial as jest.Mock).mockResolvedValue({ _id: id });
    await deleteLessonMaterialController(req as Request, res as Response, next);
    expect(service.deleteLessonMaterial).toHaveBeenCalled();
  });

  it("uploadLessonMaterialController works with single file", async () => {
    const lessonId = new mongoose.Types.ObjectId().toString();
    req.files = [{ size: 10 }];
    req.body = { lessonId, title: "T", type: "pdf" };
    (schemas.UploadMaterialSchema.parse as jest.Mock).mockReturnValue({ lessonId, title: "T", type: "pdf" });
    (service.uploadLessonMaterial as jest.Mock).mockResolvedValue({ _id: "1" });
    await uploadLessonMaterialController(req as Request, res as Response, next);
    expect(service.uploadLessonMaterial).toHaveBeenCalled();
  });

  it("downloadLessonMaterialController success flow", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    req.params = { id };
    (schemas.LessonMaterialByIdSchema.parse as jest.Mock).mockReturnValue({ id });
    (service.getLessonMaterialById as jest.Mock).mockResolvedValue({ hasAccess: true });
    (service.getMaterialForDownload as jest.Mock).mockResolvedValue({ _id: id, key: "files/a.pdf", originalName: "a.pdf" });
    await downloadLessonMaterialController(req as Request, res as Response, next);
    expect(res.success).toHaveBeenCalled();
  });
});








