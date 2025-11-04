// LessonMaterial Service Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";

// Mock dependencies
jest.mock("@/models/lessonMaterial.model");
jest.mock("@/models/lesson.model");
jest.mock("@/models/course.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/uploadFile", () => ({
  uploadFile: jest.fn().mockResolvedValue({ key: "k", originalName: "f.pdf", mimeType: "application/pdf", size: 10 }),
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url"),
}));

import LessonMaterialModel from "@/models/lessonMaterial.model";
import LessonModel from "@/models/lesson.model";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import appAssert from "@/utils/appAssert";

import {
  getLessonMaterials,
  getLessonMaterialsByLesson,
  getLessonMaterialById,
  createLessonMaterial,
  updateLessonMaterial,
  deleteLessonMaterial,
  uploadLessonMaterial,
  getMaterialForDownload,
} from "@/services/lessonMaterial.service";

describe("📎 LessonMaterial Service Unit Tests", () => {
  const userIds = {
    admin: new mongoose.Types.ObjectId().toString(),
    teacher: new mongoose.Types.ObjectId().toString(),
    student: new mongoose.Types.ObjectId().toString(),
    uploader: new mongoose.Types.ObjectId().toString(),
  };

  const courseId = new mongoose.Types.ObjectId();
  const lessonId = new mongoose.Types.ObjectId();
  const materialId = new mongoose.Types.ObjectId();

  const lesson = {
    _id: lessonId,
    title: "L1",
    courseId: { _id: courseId, teacherIds: [new mongoose.Types.ObjectId(userIds.teacher)] },
  } as any;

  const material = {
    _id: materialId,
    lessonId,
    title: "Doc 1",
    key: "manual-materials/x/y",
    uploadedBy: new mongoose.Types.ObjectId(userIds.uploader),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (appAssert as unknown as jest.Mock).mockImplementation((cond: any, _code: any, message: string) => {
      if (!cond) throw new Error(message);
    });
  });

  describe("getLessonMaterials", () => {
    it("admin sees paginated list", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([material]),
      };
      (LessonMaterialModel.find as any).mockReturnValue(mockQuery);
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);

      const result = await getLessonMaterials({ page: 1, limit: 10 }, userIds.admin, Role.ADMIN);
      expect(result.materials).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("student filtered by enrolled lessons", async () => {
      (EnrollmentModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ courseId }]) });
      (LessonModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: lessonId }]) });
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([material]),
      };
      (LessonMaterialModel.find as any).mockReturnValue(mockQuery);
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);

      // Mock for access checks inside map
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { _id: courseId } }) });
      (EnrollmentModel.findOne as any).mockResolvedValue({});
      const result = await getLessonMaterials({ page: 1, limit: 10 }, userIds.student, Role.STUDENT);
      expect(result.materials.length).toBe(1);
    });
  });

  describe("getLessonMaterialsByLesson", () => {
    it("admin gets materials by lesson", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ ...lesson }) });
      (LessonMaterialModel.find as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([material]) });
      const result = await getLessonMaterialsByLesson(lessonId.toString(), userIds.admin, Role.ADMIN);
      expect(result).toHaveLength(1);
    });

    it("student must be enrolled", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ ...lesson }) });
      (EnrollmentModel.findOne as any).mockResolvedValue(null);
      await expect(getLessonMaterialsByLesson(lessonId.toString(), userIds.student, Role.STUDENT)).rejects.toThrow("Not enrolled in this course");
    });
  });

  describe("getLessonMaterialById", () => {
    it("teacher uploader has access and gets signed url if not manual", async () => {
      const m = { ...material, key: "files/a.pdf", uploadedBy: { _id: new mongoose.Types.ObjectId(userIds.uploader) } };
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(m) });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [new mongoose.Types.ObjectId(userIds.teacher)] } }) });
      const result = await getLessonMaterialById(materialId.toString(), userIds.uploader, Role.TEACHER);
      expect(result.hasAccess).toBe(true);
      expect(result.signedUrl).toBeDefined();
    });
  });

  describe("createLessonMaterial", () => {
    it("teacher instructor can create manual material", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [new mongoose.Types.ObjectId(userIds.teacher)] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockResolvedValue({ _id: materialId });
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });

      const data = { lessonId: lessonId.toString(), title: "Doc 1", note: "n" } as any;
      const result = await createLessonMaterial(data, userIds.admin, Role.ADMIN);
      expect(result).toBeDefined();
    });
  });

  describe("updateLessonMaterial", () => {
    it("instructor updates title", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [new mongoose.Types.ObjectId(userIds.teacher)] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ ...material, title: "New" }) });

      const res = await updateLessonMaterial(materialId.toString(), { title: "New" }, userIds.admin, Role.ADMIN);
      expect(res?.title).toBe("New");
    });
  });

  describe("deleteLessonMaterial", () => {
    it("admin deletes", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      (LessonMaterialModel.findByIdAndDelete as any).mockResolvedValue(material);
      const res = await deleteLessonMaterial(materialId.toString(), userIds.admin, Role.ADMIN);
      expect(res).toBeDefined();
    });
  });

  describe("uploadLessonMaterial", () => {
    it("single file upload by instructor", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [new mongoose.Types.ObjectId(userIds.teacher)] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockResolvedValue({ _id: materialId });
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });

      const file = { size: 10 } as any;
      const res = await uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, file, userIds.admin, Role.ADMIN);
      expect(res).toBeDefined();
    });

    it("multi upload returns array", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [new mongoose.Types.ObjectId(userIds.teacher)] } }) });
      (LessonMaterialModel.create as any).mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() }).mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() });
      (LessonMaterialModel.find as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([material, { ...material, _id: new mongoose.Types.ObjectId() }]) });
      const files = [{ size: 5 } as any, { size: 6 } as any];
      const res = await uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, files, userIds.admin, Role.ADMIN);
      expect(Array.isArray(res)).toBe(true);
    });
  });

  describe("getMaterialForDownload", () => {
    it("returns material metadata", async () => {
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });
      const res = await getMaterialForDownload(materialId.toString());
      expect(res).toBeDefined();
    });
  });
});


