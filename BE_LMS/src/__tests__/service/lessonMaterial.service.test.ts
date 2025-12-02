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
  removeFile: jest.fn().mockResolvedValue(undefined),
}));

import LessonMaterialModel from "@/models/lessonMaterial.model";
import LessonModel from "@/models/lesson.model";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import appAssert from "@/utils/appAssert";
import { removeFile } from "@/utils/uploadFile";

import {
  getLessonMaterials,
  getLessonMaterialsByLesson,
  getLessonMaterialById,
  createLessonMaterial,
  updateLessonMaterial,
  deleteLessonMaterial,
  uploadLessonMaterial,
  getMaterialForDownload,
  deleteFileOfMaterial,
} from "@/services/lessonMaterial.service";

describe("📎 LessonMaterial Service Unit Tests", () => {
  const userIds = {
    admin: new mongoose.Types.ObjectId(),
    teacher: new mongoose.Types.ObjectId(),
    student: new mongoose.Types.ObjectId(),
    uploader: new mongoose.Types.ObjectId(),
  };

  const courseId = new mongoose.Types.ObjectId();
  const lessonId = new mongoose.Types.ObjectId();
  const materialId = new mongoose.Types.ObjectId();

  const lesson = {
    _id: lessonId,
    title: "L1",
    courseId: { _id: courseId, teacherIds: [userIds.teacher] },
  } as any;

  const material = {
    _id: materialId,
    lessonId,
    title: "Doc 1",
    key: "manual-materials/x/y",
    uploadedBy: userIds.uploader,
  } as any;

const buildFindQuery = (results: any[]) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(results),
});

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

    it("admin filters by title", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([material]),
      };
      (LessonMaterialModel.find as any).mockReturnValue(mockQuery);
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);

      const result = await getLessonMaterials({ page: 1, limit: 10, title: "Doc" }, userIds.admin, Role.ADMIN);
      expect(LessonMaterialModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ title: { $regex: "Doc", $options: "i" } })
      );
    });

    it("teacher sees materials from their courses or uploaded by them", async () => {
      // Mock teacher courses
      const teacherCourses = [{ _id: courseId }];
      const mockCourseQuery = {
        select: jest.fn().mockResolvedValue(teacherCourses),
      };
      (CourseModel.find as any).mockReturnValue(mockCourseQuery);

      // Mock teacher lessons
      const teacherLessons = [{ _id: lessonId }];
      const mockLessonQuery = {
        select: jest.fn().mockResolvedValue(teacherLessons),
      };
      (LessonModel.find as any).mockReturnValue(mockLessonQuery);

      // Mock materials query
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
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ courseId: { _id: courseId, teacherIds: [userIds.teacher] } }) 
      });
      (EnrollmentModel.findOne as any).mockResolvedValue(null);
      
      const result = await getLessonMaterials({ page: 1, limit: 10 }, userIds.teacher, Role.TEACHER);
      expect(result.materials).toBeDefined();
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
      expect(result.materials[0].accessReason).toBe("enrolled");
    });

    it("applies type filter for pdf", async () => {
      const mockQuery = buildFindQuery([]);
      (LessonMaterialModel.find as any).mockImplementation((filter: any) => {
        expect(filter.$and?.[0]?.$or).toBeDefined();
        return mockQuery;
      });
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(0);

      await getLessonMaterials({ page: 1, limit: 5, type: "pdf" }, userIds.admin, Role.ADMIN);
    });

    it("applies type filter for other files", async () => {
      const mockQuery = buildFindQuery([]);
      (LessonMaterialModel.find as any).mockImplementation((filter: any) => {
        expect(filter.$nor).toBeDefined();
        return mockQuery;
      });
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(0);

      await getLessonMaterials({ page: 1, limit: 5, type: "other" }, userIds.admin, Role.ADMIN);
    });

    it("converts uploadedBy and lessonId to ObjectId and filters by size", async () => {
      const uploadedBy = new mongoose.Types.ObjectId().toString();
      const lessonIdString = new mongoose.Types.ObjectId().toString();
      const mockQuery = buildFindQuery([]);
      (LessonMaterialModel.find as any).mockImplementation((filter: any) => {
        expect(filter.size).toBe(1024);
        expect(filter.uploadedBy).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(filter.lessonId).toBeInstanceOf(mongoose.Types.ObjectId);
        return mockQuery;
      });
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(0);

      await getLessonMaterials(
        { page: 1, limit: 5, size: 1024, uploadedBy, lessonId: lessonIdString },
        userIds.admin,
        Role.ADMIN
      );
    });

    it("combines search and access conditions for teacher", async () => {
      (CourseModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: courseId }]) });
      (LessonModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: lessonId }]) });
      const mockQuery = buildFindQuery([]);
      (LessonMaterialModel.find as any).mockImplementation((filter: any) => {
        expect(filter.$and).toBeDefined();
        expect(filter.$and.length).toBeGreaterThanOrEqual(2);
        return mockQuery;
      });
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(0);

      await getLessonMaterials({ page: 1, limit: 5, search: "math" }, userIds.teacher, Role.TEACHER);
    });

    it("marks instructor access with signed url for teacher", async () => {
      const instructorMaterial = {
        _id: new mongoose.Types.ObjectId(),
        lessonId,
        key: "files/instructor.pdf",
        uploadedBy: { _id: new mongoose.Types.ObjectId() },
      };
      (CourseModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: courseId }]) });
      (LessonModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: lessonId }]) });
      (LessonMaterialModel.find as any).mockReturnValue(buildFindQuery([instructorMaterial]));
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) =>
        teacherIdsArray.some((tid) => tid.toString() === id.toString())
      );
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: teacherIdsArray } }),
      });

      const result = await getLessonMaterials({ page: 1, limit: 5 }, userIds.teacher, Role.TEACHER);
      expect(result.materials[0].accessReason).toBe("instructor");
      expect(result.materials[0].signedUrl).toBeDefined();
    });

    it("marks uploader access for teacher uploader", async () => {
      const uploaderId = userIds.teacher;
      const uploaderMaterial = {
        _id: new mongoose.Types.ObjectId(),
        lessonId,
        key: "files/uploader.pdf",
        uploadedBy: { _id: uploaderId },
      };
      (CourseModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: courseId }]) });
      (LessonModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: lessonId }]) });
      (LessonMaterialModel.find as any).mockReturnValue(buildFindQuery([uploaderMaterial]));
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [] } }),
      });

      const result = await getLessonMaterials({ page: 1, limit: 5 }, uploaderId, Role.TEACHER);
      expect(result.materials[0].accessReason).toBe("uploader");
    });

    it("keeps access false for student without enrollment", async () => {
      (EnrollmentModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ courseId }]) });
      (LessonModel.find as any).mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: lessonId }]) });
      const studentMaterial = {
        _id: new mongoose.Types.ObjectId(),
        lessonId,
        key: "files/student.pdf",
        uploadedBy: { _id: new mongoose.Types.ObjectId() },
      };
      (LessonMaterialModel.find as any).mockReturnValue(buildFindQuery([studentMaterial]));
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ courseId: { _id: courseId } }),
      });
      (EnrollmentModel.findOne as any).mockResolvedValue(null);

      const result = await getLessonMaterials({ page: 1, limit: 5 }, userIds.student, Role.STUDENT);
      expect(result.materials[0].hasAccess).toBe(false);
      expect(result.materials[0].accessReason).toBe("");
    });

    it("skips signed url generation for manual materials", async () => {
      const manualMaterial = {
        _id: new mongoose.Types.ObjectId(),
        lessonId,
        key: "manual-materials/lesson/file",
        uploadedBy: { _id: new mongoose.Types.ObjectId() },
      };
      (LessonMaterialModel.find as any).mockReturnValue(buildFindQuery([manualMaterial]));
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);

      const result = await getLessonMaterials({ page: 1, limit: 5 }, userIds.admin, Role.ADMIN);
      expect(result.materials[0].signedUrl).toBeUndefined();
      expect(result.materials[0].accessReason).toBe("admin");
    });

    it("applies search-only conditions for admin", async () => {
      const mockQuery = buildFindQuery([material]);
      const findMock = LessonMaterialModel.find as any;
      findMock.mockReturnValue(mockQuery);
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(1);

      await getLessonMaterials({ page: 1, limit: 5, search: "document" }, userIds.admin, Role.ADMIN);

      expect(findMock).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.arrayContaining([expect.objectContaining({ $or: expect.any(Array) })]),
        })
      );
    });

    it("applies createdAt range filters", async () => {
      const mockQuery = buildFindQuery([]);
      (LessonMaterialModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toEqual(toDate);
        return mockQuery;
      });
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(0);

      const fromDate = new Date("2024-01-01");
      const toDate = new Date("2024-01-31");
      await getLessonMaterials({ page: 1, limit: 5, from: fromDate, to: toDate }, userIds.admin, Role.ADMIN);
    });

    it("applies createdAt filter with only from date", async () => {
      const fromDate = new Date("2024-01-01");
      const mockQuery = buildFindQuery([]);
      (LessonMaterialModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toBeDefined();
        expect(filter.createdAt.$lte).toBeUndefined();
        return mockQuery;
      });
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(0);

      await getLessonMaterials({ page: 1, limit: 5, from: fromDate }, userIds.admin, Role.ADMIN);
    });

    it("applies createdAt filter with only to date", async () => {
      const toDate = new Date("2024-12-31");
      const mockQuery = buildFindQuery([]);
      (LessonMaterialModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toBeUndefined();
        expect(filter.createdAt.$lte).toBeDefined();
        return mockQuery;
      });
      (LessonMaterialModel.countDocuments as any).mockResolvedValue(0);

      await getLessonMaterials({ page: 1, limit: 5, to: toDate }, userIds.admin, Role.ADMIN);
    });
  });

  describe("getLessonMaterialsByLesson", () => {
    it("admin gets materials by lesson", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ ...lesson }) });
      (LessonMaterialModel.find as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([material]) });
      const result = await getLessonMaterialsByLesson(lessonId.toString(), userIds.admin, Role.ADMIN);
      expect(result).toHaveLength(1);
    });

    it("teacher instructor gets all materials", async () => {
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ 
          ...lesson, 
          courseId: { _id: courseId, teacherIds: [userIds.teacher] } 
        }) 
      });
      (LessonMaterialModel.find as any).mockReturnValue({ 
        populate: jest.fn().mockReturnThis(), 
        sort: jest.fn().mockReturnThis(), 
        lean: jest.fn().mockResolvedValue([material]) 
      });
      const result = await getLessonMaterialsByLesson(lessonId.toString(), userIds.teacher, Role.TEACHER);
      expect(result).toHaveLength(1);
    });

    it("teacher non-instructor gets only own materials", async () => {
      const otherTeacherId = new mongoose.Types.ObjectId();
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ 
          ...lesson, 
          courseId: { _id: courseId, teacherIds: [otherTeacherId] } 
        }) 
      });
      (LessonMaterialModel.find as any).mockReturnValue({ 
        populate: jest.fn().mockReturnThis(), 
        sort: jest.fn().mockReturnThis(), 
        lean: jest.fn().mockResolvedValue([material]) 
      });
      const result = await getLessonMaterialsByLesson(lessonId.toString(), userIds.teacher, Role.TEACHER);
      expect(LessonMaterialModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ uploadedBy: userIds.teacher })
      );
    });

    it("student must be enrolled", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ ...lesson }) });
      (EnrollmentModel.findOne as any).mockResolvedValue(null);
      await expect(getLessonMaterialsByLesson(lessonId.toString(), userIds.student, Role.STUDENT)).rejects.toThrow("Not enrolled in this course");
    });

    it("throws error for invalid lesson ID", async () => {
      await expect(getLessonMaterialsByLesson("invalid", userIds.admin, Role.ADMIN)).rejects.toThrow("Invalid lesson ID format");
    });

    it("throws error when lesson not found", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      await expect(getLessonMaterialsByLesson(lessonId.toString(), userIds.admin, Role.ADMIN)).rejects.toThrow("Lesson not found");
    });

    it("returns empty array for unsupported role", async () => {
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...lesson }),
      });
      const result = await getLessonMaterialsByLesson(
        lessonId.toString(),
        undefined as unknown as mongoose.Types.ObjectId,
        undefined
      );
      expect(result).toEqual([]);
    });
  });

  describe("getLessonMaterialById", () => {
    it("admin has access", async () => {
      const m = { ...material, key: "files/a.pdf" };
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(m) });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [] } }) });
      const result = await getLessonMaterialById(materialId.toString(), userIds.admin, Role.ADMIN);
      expect(result.hasAccess).toBe(true);
    });

    it("teacher uploader has access and gets signed url if not manual", async () => {
      const m = { ...material, key: "files/a.pdf", uploadedBy: { _id: userIds.uploader } };
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(m) });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [userIds.teacher] } }) });
      const result = await getLessonMaterialById(materialId.toString(), userIds.uploader, Role.TEACHER);
      expect(result.hasAccess).toBe(true);
      expect(result.signedUrl).toBeDefined();
    });

    it("teacher instructor has access", async () => {
      const m = { ...material, key: "files/a.pdf" };
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(m) });
      // Mock teacherIds as array with includes method that compares by value
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => {
        return teacherIdsArray.some(tid => tid.toString() === id.toString());
      });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: teacherIdsArray } }) });
      const result = await getLessonMaterialById(materialId.toString(), userIds.teacher, Role.TEACHER);
      expect(result.hasAccess).toBe(true);
    });

    it("student enrolled has access", async () => {
      const m = { ...material, key: "files/a.pdf" };
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(m) });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { _id: courseId } }) });
      (EnrollmentModel.findOne as any).mockResolvedValue({ studentId: userIds.student, courseId, status: "active" });
      const result = await getLessonMaterialById(materialId.toString(), userIds.student, Role.STUDENT);
      expect(result.hasAccess).toBe(true);
    });

    it("student not enrolled has no access", async () => {
      const m = { ...material, key: "files/a.pdf" };
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(m) });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { _id: courseId } }) });
      (EnrollmentModel.findOne as any).mockResolvedValue(null);
      const result = await getLessonMaterialById(materialId.toString(), userIds.student, Role.STUDENT);
      expect(result.hasAccess).toBe(false);
    });

    it("throws error for invalid material ID format", async () => {
      await expect(getLessonMaterialById("invalid", userIds.admin, Role.ADMIN)).rejects.toThrow("Invalid material ID format");
    });

    it("does not generate signed url for manual material", async () => {
      const manualMaterial = { ...material, key: "manual-materials/lesson/file" };
      (LessonMaterialModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(manualMaterial),
      });
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) =>
        teacherIdsArray.some((tid) => tid.toString() === id.toString())
      );
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: teacherIdsArray } }),
      });

      const result = await getLessonMaterialById(materialId.toString(), userIds.teacher, Role.TEACHER);
      expect(result.signedUrl).toBeUndefined();
      expect(result.accessReason).toBe("instructor");
    });

    it("throws error when material not found", async () => {
      const validMaterialId = new mongoose.Types.ObjectId().toString();
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });
      await expect(getLessonMaterialById(validMaterialId, userIds.admin, Role.ADMIN)).rejects.toThrow("Material not found");
    });
  });

  describe("createLessonMaterial", () => {
    it("admin can create manual material", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [userIds.teacher] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockResolvedValue({ _id: materialId });
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });

      const data = { lessonId: lessonId.toString(), title: "Doc 1", note: "n" } as any;
      const result = await createLessonMaterial(data, userIds.admin, Role.ADMIN);
      expect(result).toBeDefined();
    });

    it("teacher instructor can create manual material", async () => {
      // Mock teacherIds with custom includes that compares by value
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => {
        return teacherIdsArray.some(tid => tid.toString() === id.toString());
      });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: teacherIdsArray } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockResolvedValue({ _id: materialId });
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });

      const data = { lessonId: lessonId.toString(), title: "Doc 1", note: "n" } as any;
      const result = await createLessonMaterial(data, userIds.teacher, Role.TEACHER);
      expect(result).toBeDefined();
    });

    it("throws error when lesson not found", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      const data = { lessonId: lessonId.toString(), title: "Doc 1" } as any;
      await expect(createLessonMaterial(data, userIds.admin, Role.ADMIN)).rejects.toThrow("Lesson not found");
    });

    it("throws error when title conflict exists", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [userIds.teacher] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue({ _id: materialId });
      const data = { lessonId: lessonId.toString(), title: "Doc 1" } as any;
      await expect(createLessonMaterial(data, userIds.admin, Role.ADMIN)).rejects.toThrow("Material with this title already exists");
    });

    it("throws error when unauthorized (not instructor)", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      const data = { lessonId: lessonId.toString(), title: "Doc 1" } as any;
      await expect(createLessonMaterial(data, userIds.teacher, Role.TEACHER)).rejects.toThrow("Only course instructors can add materials");
    });

    it("uses provided optional file metadata when creating", async () => {
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) =>
        teacherIdsArray.some((tid) => tid.toString() === id.toString())
      );
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: teacherIdsArray } }),
      });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      const created = { _id: new mongoose.Types.ObjectId() };
      (LessonMaterialModel.create as any).mockImplementation(async (payload: any) => {
        expect(payload.key).toBe("custom/key");
        expect(payload.originalName).toBe("file.pdf");
        expect(payload.mimeType).toBe("application/pdf");
        expect(payload.size).toBe(123);
        return created;
      });
      (LessonMaterialModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(material),
      });

      const data = {
        lessonId: lessonId.toString(),
        title: "Doc 1",
        key: "custom/key",
        originalName: "file.pdf",
        mimeType: "application/pdf",
        size: 123,
      } as any;

      const result = await createLessonMaterial(data, userIds.teacher, Role.TEACHER);
      expect(result).toBeDefined();
      expect(LessonMaterialModel.create).toHaveBeenCalled();
    });
  });

  describe("updateLessonMaterial", () => {
    it("admin updates title", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [userIds.teacher] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ ...material, title: "New" }) });

      const res = await updateLessonMaterial(
        materialId.toString(),
        { title: "New" },
        undefined,
        userIds.admin,
        Role.ADMIN
      );
      expect(res?.title).toBe("New");
    });

    it("instructor updates title", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      // Mock teacherIds with custom includes that compares by value
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => {
        return teacherIdsArray.some(tid => tid.toString() === id.toString());
      });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: teacherIdsArray } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ ...material, title: "New" }) });

      const res = await updateLessonMaterial(
        materialId.toString(),
        { title: "New" },
        undefined,
        userIds.teacher,
        Role.TEACHER
      );
      expect(res?.title).toBe("New");
    });

    it("throws error when material not found", async () => {
      const validMaterialId = new mongoose.Types.ObjectId().toString();
      (LessonMaterialModel.findById as any).mockResolvedValue(null);
      await expect(
        updateLessonMaterial(
          validMaterialId,
          { title: "New" },
          undefined,
          userIds.admin,
          Role.ADMIN
        )
      ).rejects.toThrow("Material not found");
    });

    it("throws error when title conflict exists", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material, title: "Old Title" });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [userIds.teacher] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
      await expect(
        updateLessonMaterial(
          materialId.toString(),
          { title: "Existing Title" },
          undefined,
          userIds.admin,
          Role.ADMIN
        )
      ).rejects.toThrow("Material with this title already exists");
    });

    it("throws error for invalid material ID format", async () => {
      await expect(
        updateLessonMaterial(
          "invalid",
          { title: "New" },
          undefined,
          userIds.admin,
          Role.ADMIN
        )
      ).rejects.toThrow("Invalid material ID format");
    });

    it("throws error when student tries to update", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      await expect(
        updateLessonMaterial(
          materialId.toString(),
          { title: "New" },
          undefined,
          userIds.student,
          Role.STUDENT
        )
      ).rejects.toThrow("Students cannot update lesson materials");
    });

    it("updates material with file upload", async () => {
      const materialDoc = {
        ...material,
        key: "old-file.pdf",
        uploadedBy: userIds.admin,
      };
      (LessonMaterialModel.findById as any).mockResolvedValue(materialDoc);
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ 
          _id: lessonId,
          courseId: { _id: courseId, teacherIds: [userIds.admin] } 
        }),
      });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...materialDoc, key: "new-file.pdf" }),
      });
      const { uploadFile } = require("@/utils/uploadFile");
      (uploadFile as jest.Mock).mockResolvedValue({
        key: "new-file.pdf",
        originalName: "new.pdf",
        mimeType: "application/pdf",
      });

      const mockFile = {
        size: 1000,
        buffer: Buffer.from("test"),
      } as any;

      const result = await updateLessonMaterial(
        materialId.toString(),
        { title: "Updated" },
        mockFile,
        userIds.admin,
        Role.ADMIN
      );
      expect(result).toBeDefined();
      expect(uploadFile).toHaveBeenCalled();
    });

    it("updates material with file upload when courseId has no _id property", async () => {
      const materialDoc = {
        ...material,
        key: "old-file.pdf",
        uploadedBy: userIds.admin,
        lessonId: lessonId.toString(), // Not ObjectId
      };
      (LessonMaterialModel.findById as any).mockResolvedValue(materialDoc);
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ 
          _id: lessonId,
          courseId: courseId, // Direct ObjectId, no _id property
          teacherIds: [userIds.admin] 
        }),
      });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...materialDoc, key: "new-file.pdf" }),
      });
      const { uploadFile } = require("@/utils/uploadFile");
      (uploadFile as jest.Mock).mockResolvedValue({
        key: "new-file.pdf",
        originalName: "new.pdf",
        mimeType: "application/pdf",
      });

      const mockFile = {
        size: 1000,
        buffer: Buffer.from("test"),
      } as any;

      const result = await updateLessonMaterial(
        materialId.toString(),
        { title: "Updated" },
        mockFile,
        userIds.admin,
        Role.ADMIN
      );
      expect(result).toBeDefined();
      expect(uploadFile).toHaveBeenCalled();
    });

    it("updates material with file upload when courseId is not ObjectId instance", async () => {
      const materialDoc = {
        ...material,
        key: "old-file.pdf",
        uploadedBy: userIds.admin,
      };
      (LessonMaterialModel.findById as any).mockResolvedValue(materialDoc);
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ 
          _id: lessonId,
          courseId: { _id: courseId.toString(), teacherIds: [userIds.admin] } // String instead of ObjectId
        }),
      });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...materialDoc, key: "new-file.pdf" }),
      });
      const { uploadFile } = require("@/utils/uploadFile");
      (uploadFile as jest.Mock).mockResolvedValue({
        key: "new-file.pdf",
        originalName: "new.pdf",
        mimeType: "application/pdf",
      });

      const mockFile = {
        size: 1000,
        buffer: Buffer.from("test"),
      } as any;

      const result = await updateLessonMaterial(
        materialId.toString(),
        { title: "Updated" },
        mockFile,
        userIds.admin,
        Role.ADMIN
      );
      expect(result).toBeDefined();
      expect(uploadFile).toHaveBeenCalled();
    });

    it("throws error when unauthorized (not instructor)", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [] } }) });
      await expect(
        updateLessonMaterial(
          materialId.toString(),
          { title: "New" },
          undefined,
          userIds.teacher,
          Role.TEACHER
        )
      ).rejects.toThrow("Not authorized");
    });

    it("updates optional fields when provided", async () => {
      const materialDoc = {
        ...material,
        uploadedBy: userIds.admin,
      };
      (LessonMaterialModel.findById as any).mockResolvedValue(materialDoc);
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [userIds.admin] } }),
      });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(material),
      });

      await updateLessonMaterial(
        materialId.toString(),
        {
          note: "Updated note",
          originalName: "updated.pdf",
          mimeType: "application/pdf",
          size: 999,
          key: "new/key",
        },
        undefined,
        userIds.admin,
        Role.ADMIN
      );

      expect(LessonMaterialModel.findByIdAndUpdate).toHaveBeenCalledWith(
        materialId.toString(),
        expect.objectContaining({
          note: "Updated note",
          originalName: "updated.pdf",
          mimeType: "application/pdf",
          size: 999,
          key: "new/key",
        }),
        { new: true }
      );
    });

    it("throws error when student tries to update", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      await expect(
        updateLessonMaterial(
          materialId.toString(),
          { title: "New" },
          undefined,
          userIds.student,
          Role.STUDENT
        )
      ).rejects.toThrow("Students cannot update lesson materials");
    });
  });

  describe("deleteLessonMaterial", () => {
    it("admin deletes", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      (LessonMaterialModel.findByIdAndDelete as any).mockResolvedValue(material);
      const res = await deleteLessonMaterial(materialId.toString(), userIds.admin, Role.ADMIN);
      expect(res).toBeDefined();
    });

    it("instructor deletes", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      // Mock teacherIds with custom includes that compares by value
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => {
        return teacherIdsArray.some(tid => tid.toString() === id.toString());
      });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: teacherIdsArray } }) });
      (LessonMaterialModel.findByIdAndDelete as any).mockResolvedValue(material);
      const res = await deleteLessonMaterial(materialId.toString(), userIds.teacher, Role.TEACHER);
      expect(res).toBeDefined();
    });

    it("throws error for invalid material ID format", async () => {
      await expect(deleteLessonMaterial("invalid", userIds.admin, Role.ADMIN)).rejects.toThrow("Invalid material ID format");
    });

    it("throws error when material not found", async () => {
      const validMaterialId = new mongoose.Types.ObjectId().toString();
      (LessonMaterialModel.findById as any).mockResolvedValue(null);
      await expect(deleteLessonMaterial(validMaterialId, userIds.admin, Role.ADMIN)).rejects.toThrow("Material not found");
    });

    it("throws error when unauthorized (not instructor)", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { teacherIds: [] } }) });
      await expect(deleteLessonMaterial(materialId.toString(), userIds.teacher, Role.TEACHER)).rejects.toThrow("Not authorized");
    });

    it("throws error when student tries to delete material", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue({ ...material });
      await expect(deleteLessonMaterial(materialId.toString(), userIds.student, Role.STUDENT)).rejects.toThrow(
        "Students cannot delete lesson materials"
      );
    });
  });

  describe("uploadLessonMaterial", () => {
    it("single file upload by admin", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [userIds.teacher] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockResolvedValue({ _id: materialId });
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });

      const file = { size: 10 } as any;
      const res = await uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, file, userIds.admin, Role.ADMIN);
      expect(res).toBeDefined();
    });

    it("single file upload by instructor", async () => {
      // Mock teacherIds with custom includes that compares by value
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => {
        return teacherIdsArray.some(tid => tid.toString() === id.toString());
      });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: teacherIdsArray } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockResolvedValue({ _id: materialId });
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });

      const file = { size: 10 } as any;
      const res = await uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, file, userIds.teacher, Role.TEACHER);
      expect(res).toBeDefined();
    });

    it("multi upload returns array", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [userIds.teacher] } }) });
      (LessonMaterialModel.create as any).mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() }).mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() });
      (LessonMaterialModel.find as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([material, { ...material, _id: new mongoose.Types.ObjectId() }]) });
      const files = [{ size: 5 } as any, { size: 6 } as any];
      const res = await uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, files, userIds.admin, Role.ADMIN);
      expect(Array.isArray(res)).toBe(true);
    });

    it("multi upload uses originalName when title not provided", async () => {
      const { uploadFile } = require("@/utils/uploadFile");
      (uploadFile as jest.Mock).mockResolvedValue({
        key: "file1.pdf",
        originalName: "document.pdf",
        mimeType: "application/pdf",
        size: 100,
      });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [userIds.admin] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockImplementation(async (data: any) => {
        expect(data.title).toBe("document.pdf"); // Should use originalName
        return { _id: materialId };
      });
      (LessonMaterialModel.find as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([material]) });

      const files = [{ size: 100 } as any];
      await uploadLessonMaterial({ lessonId: lessonId.toString() }, files, userIds.admin, Role.ADMIN);
    });

    it("multi upload uses fallback title when title and originalName not provided", async () => {
      const { uploadFile } = require("@/utils/uploadFile");
      (uploadFile as jest.Mock).mockResolvedValue({
        key: "file1.pdf",
        originalName: undefined,
        mimeType: "application/pdf",
        size: 100,
      });
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [userIds.admin] } }) });
      (LessonMaterialModel.exists as any).mockResolvedValue(null);
      (LessonMaterialModel.create as any).mockImplementation(async (data: any) => {
        expect(data.title).toBe("Material 1"); // Should use fallback
        return { _id: materialId };
      });
      (LessonMaterialModel.find as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([material]) });

      const files = [{ size: 100 } as any];
      await uploadLessonMaterial({ lessonId: lessonId.toString() }, files, userIds.admin, Role.ADMIN);
    });

    it("throws error when lesson not found", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      const file = { size: 10 } as any;
      await expect(uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, file, userIds.admin, Role.ADMIN)).rejects.toThrow("Lesson not found");
    });

    it("throws error when unauthorized (not instructor)", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [] } }) });
      const file = { size: 10 } as any;
      await expect(uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, file, userIds.teacher, Role.TEACHER)).rejects.toThrow("Only course instructors can upload materials");
    });

    it("throws error when no file uploaded", async () => {
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => teacherIdsArray.some((tid) => tid.toString() === id.toString()));
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: teacherIdsArray } }),
      });
      await expect(
        uploadLessonMaterial({ lessonId: lessonId.toString(), title: "Doc" }, undefined as any, userIds.teacher, Role.TEACHER)
      ).rejects.toThrow("No file uploaded");
    });

    it("throws error when no files uploaded (empty array)", async () => {
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => teacherIdsArray.some((tid) => tid.toString() === id.toString()));
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: teacherIdsArray } }),
      });
      await expect(
        uploadLessonMaterial({ lessonId: lessonId.toString(), title: "Doc" }, [] as any, userIds.teacher, Role.TEACHER)
      ).rejects.toThrow("No files uploaded");
    });

    it("throws error when student uploads material", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: [] } }) });
      const file = { size: 10 } as any;
      await expect(
        uploadLessonMaterial({ lessonId: lessonId.toString(), title: "A" }, file, userIds.student, Role.STUDENT)
      ).rejects.toThrow("Students cannot upload lesson materials");
    });

    it("throws error when multi upload detects title conflict", async () => {
      const teacherIdsArray = [userIds.teacher];
      teacherIdsArray.includes = jest.fn((id: any) => teacherIdsArray.some((tid) => tid.toString() === id.toString()));
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: lessonId, courseId: { _id: courseId, teacherIds: teacherIdsArray } }),
      });
      (LessonMaterialModel.exists as any).mockResolvedValueOnce(true);

      const files = [{ size: 5 } as any, { size: 6 } as any];
      await expect(
        uploadLessonMaterial({ lessonId: lessonId.toString(), title: "Conflicted" }, files, userIds.teacher, Role.TEACHER)
      ).rejects.toThrow("Material with this title already exists in this lesson");
    });
  });

  describe("getMaterialForDownload", () => {
    it("returns material metadata", async () => {
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(material) });
      const res = await getMaterialForDownload(materialId.toString());
      expect(res).toBeDefined();
    });

    it("throws error for invalid material ID format", async () => {
      await expect(getMaterialForDownload("invalid")).rejects.toThrow("Invalid material ID format");
    });

    it("throws error when material not found", async () => {
      const validMaterialId = new mongoose.Types.ObjectId().toString();
      (LessonMaterialModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });
      await expect(getMaterialForDownload(validMaterialId)).rejects.toThrow("Material not found");
    });
  });

  describe("deleteFileOfMaterial", () => {
    const materialWithFile = {
      _id: materialId,
      lessonId,
      title: "Doc 1",
      key: "files/test.pdf",
      originalName: "test.pdf",
      mimeType: "application/pdf",
      size: 1000,
      uploadedBy: userIds.uploader,
    } as any;

    const updatedMaterial = {
      _id: materialId,
      lessonId,
      title: "Doc 1",
      key: undefined,
      originalName: undefined,
      mimeType: undefined,
      size: undefined,
      uploadedBy: { _id: userIds.uploader },
    } as any;

    it("admin deletes file successfully", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue(materialWithFile);
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ 
          courseId: { _id: courseId, teacherIds: [] } 
        }) 
      });
      (removeFile as jest.Mock).mockResolvedValue(undefined);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({ 
        populate: jest.fn().mockReturnThis(), 
        lean: jest.fn().mockResolvedValue(updatedMaterial) 
      });

      const result = await deleteFileOfMaterial(materialId.toString(), userIds.admin, Role.ADMIN);
      expect(result.material).toBeDefined();
      expect(result.deletedKey).toBe("files/test.pdf");
      expect(removeFile).toHaveBeenCalledWith("files/test.pdf");
      expect(LessonMaterialModel.findByIdAndUpdate).toHaveBeenCalledWith(
        materialId.toString(),
        { $unset: { key: "", originalName: "", mimeType: "", size: "" } },
        { new: true }
      );
    });

    it("teacher instructor deletes file successfully", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue(materialWithFile);
      const teacherIdsArray = [userIds.teacher];
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ 
          courseId: { _id: courseId, teacherIds: teacherIdsArray } 
        }) 
      });
      (removeFile as jest.Mock).mockResolvedValue(undefined);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({ 
        populate: jest.fn().mockReturnThis(), 
        lean: jest.fn().mockResolvedValue(updatedMaterial) 
      });

      const result = await deleteFileOfMaterial(materialId.toString(), userIds.teacher, Role.TEACHER);
      expect(result.material).toBeDefined();
      expect(removeFile).toHaveBeenCalled();
    });

    it("teacher uploader deletes file successfully", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue(materialWithFile);
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({
          courseId: { _id: courseId, teacherIds: [] } 
        }) 
      });
      (removeFile as jest.Mock).mockResolvedValue(undefined);
      (LessonMaterialModel.findByIdAndUpdate as any).mockReturnValue({ 
        populate: jest.fn().mockReturnThis(), 
        lean: jest.fn().mockResolvedValue(updatedMaterial) 
      });

      const result = await deleteFileOfMaterial(materialId.toString(), userIds.uploader, Role.TEACHER);
      expect(result.material).toBeDefined();
      expect(removeFile).toHaveBeenCalled();
    });

    it("throws error when material not found", async () => {
      const validMaterialId = new mongoose.Types.ObjectId().toString();
      (LessonMaterialModel.findById as any).mockResolvedValue(null);
      await expect(deleteFileOfMaterial(validMaterialId, userIds.admin, Role.ADMIN)).rejects.toThrow("Material not found");
    });

    it("throws error when material has no file (manual material)", async () => {
      const manualMaterial = {
        ...materialWithFile,
        key: "manual-materials/test/uuid"
      };
      (LessonMaterialModel.findById as any).mockResolvedValue(manualMaterial);
      await expect(deleteFileOfMaterial(materialId.toString(), userIds.admin, Role.ADMIN)).rejects.toThrow("This material does not have a file to delete");
    });

    it("throws error when material has no key", async () => {
      const materialNoKey = {
        ...materialWithFile,
        key: null
      };
      (LessonMaterialModel.findById as any).mockResolvedValue(materialNoKey);
      await expect(deleteFileOfMaterial(materialId.toString(), userIds.admin, Role.ADMIN)).rejects.toThrow("This material does not have a file to delete");
    });

    it("throws error when lesson not found", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue(materialWithFile);
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue(null) 
      });
      await expect(deleteFileOfMaterial(materialId.toString(), userIds.admin, Role.ADMIN)).rejects.toThrow("Lesson not found");
    });

    it("throws error when student tries to delete", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue(materialWithFile);
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ 
          courseId: { _id: courseId, teacherIds: [] } 
        }) 
      });
      await expect(deleteFileOfMaterial(materialId.toString(), userIds.student, Role.STUDENT)).rejects.toThrow("Students cannot delete lesson material files");
    });

    it("throws error when teacher is not authorized", async () => {
      const otherTeacherId = new mongoose.Types.ObjectId();
      (LessonMaterialModel.findById as any).mockResolvedValue(materialWithFile);
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ 
          courseId: { _id: courseId, teacherIds: [otherTeacherId] } 
        }) 
      });
      await expect(deleteFileOfMaterial(materialId.toString(), userIds.teacher, Role.TEACHER)).rejects.toThrow("Not authorized to delete this material file");
    });

    it("throws error when MinIO deletion fails", async () => {
      (LessonMaterialModel.findById as any).mockResolvedValue(materialWithFile);
      (LessonModel.findById as any).mockReturnValue({ 
        populate: jest.fn().mockResolvedValue({ 
          courseId: { _id: courseId, teacherIds: [] } 
        }) 
      });
      (removeFile as jest.Mock).mockRejectedValue(new Error("MinIO error"));
      await expect(deleteFileOfMaterial(materialId.toString(), userIds.admin, Role.ADMIN)).rejects.toThrow("Failed to delete file from storage");
    });

    it("throws error for invalid material ID format", async () => {
      await expect(deleteFileOfMaterial("invalid", userIds.admin, Role.ADMIN)).rejects.toThrow("Invalid material ID format");
    });
  });
});


