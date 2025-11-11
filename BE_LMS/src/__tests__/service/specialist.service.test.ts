// Specialist Service Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";

// Mock all models before importing services
jest.mock("@/models/specialist.model");
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
jest.mock("@/utils/appAssert");

// Import models for mocking
import SpecialistModel from "@/models/specialist.model";
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import appAssert from "@/utils/appAssert";

// Import services
import {
  listSpecialists,
  getSpecialistById,
  getSpecialistBySlug,
  createSpecialist,
  updateSpecialistById,
  updateSpecialistBySlug,
  deleteSpecialistById,
  deleteSpecialistBySlug,
  ListSpecialistParams,
} from "@/services/specialist.service";

describe("🎓 Specialist Service Unit Tests", () => {
  let specialistId: mongoose.Types.ObjectId;
  let majorId: mongoose.Types.ObjectId;
  let specialist: any;

  beforeEach(() => {
    // Create mock IDs
    specialistId = new mongoose.Types.ObjectId();
    majorId = new mongoose.Types.ObjectId();

    // Create mock data
    specialist = {
      _id: specialistId,
      name: "Software Engineering",
      slug: "software-engineering",
      description: "Software development and engineering practices",
      majorId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(true),
    };

    // Reset all mocks
    jest.clearAllMocks();

    // appAssert: throw Error(message) when condition falsy
    (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
      if (!condition) throw new Error(message);
    });
  });

  // ====================================
  // LIST SPECIALISTS TESTS
  // ====================================
  describe("listSpecialists", () => {
    it("should list specialists with pagination", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
      };

      const result = await listSpecialists(params);

      expect(result).toBeDefined();
      expect(result.specialists).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
      expect(SpecialistModel.find).toHaveBeenCalled();
    });

    it("should filter specialists by search term", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
        search: "Software",
      };

      const result = await listSpecialists(params);

      expect(result).toBeDefined();
      expect(SpecialistModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { title: { $regex: "Software", $options: "i" } },
            { description: { $regex: "Software", $options: "i" } },
          ],
        })
      );
    });

    it("should filter specialists by name", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
        name: "Software Engineering",
      };

      const result = await listSpecialists(params);

      expect(result).toBeDefined();
      expect(SpecialistModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Software Engineering",
        })
      );
    });

    it("should filter specialists by slug", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
        slug: "software-engineering",
      };

      const result = await listSpecialists(params);

      expect(result).toBeDefined();
      expect(SpecialistModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "software-engineering",
        })
      );
    });

    it("should filter specialists by majorId", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
        majorId: majorId.toString(),
      };

      const result = await listSpecialists(params);

      expect(result).toBeDefined();
      expect(SpecialistModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          majorId: majorId.toString(),
        })
      );
    });

    it("should filter specialists by isActive status", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
        isActive: true,
      };

      const result = await listSpecialists(params);

      expect(result).toBeDefined();
      expect(SpecialistModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });

    it("should sort specialists in ascending order", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
        sortBy: "name",
        sortOrder: "asc",
      };

      await listSpecialists(params);

      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
    });

    it("should populate majorId field", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListSpecialistParams = {
        page: 1,
        limit: 10,
      };

      await listSpecialists(params);

      expect(mockQuery.populate).toHaveBeenCalledWith(
        "majorId",
        "name slug description createdAt updatedAt"
      );
    });

    it("should calculate pagination correctly with multiple pages", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([specialist]),
      };
      (SpecialistModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(25);

      const params: ListSpecialistParams = {
        page: 2,
        limit: 10,
      };

      const result = await listSpecialists(params);

      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });
  });

  // ====================================
  // GET SPECIALIST BY ID TESTS
  // ====================================
  describe("getSpecialistById", () => {
    it("should get specialist by ID successfully", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(specialist),
      };
      (SpecialistModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await getSpecialistById(specialistId.toString());

      expect(result).toBeDefined();
      expect(result.name).toBe("Software Engineering");
      expect(SpecialistModel.findById).toHaveBeenCalledWith(specialistId.toString());
    });

    it("should throw error when specialist not found", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (SpecialistModel.findById as jest.Mock).mockReturnValue(mockQuery);

      await expect(getSpecialistById(specialistId.toString())).rejects.toThrow("Specialist not found");
    });
  });

  // ====================================
  // GET SPECIALIST BY SLUG TESTS
  // ====================================
  describe("getSpecialistBySlug", () => {
    it("should get specialist by slug successfully", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(specialist),
      };
      (SpecialistModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await getSpecialistBySlug("software-engineering");

      expect(result).toBeDefined();
      expect(result.name).toBe("Software Engineering");
      expect(SpecialistModel.findOne).toHaveBeenCalledWith({ slug: "software-engineering" });
    });

    it("should throw error when specialist not found by slug", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (SpecialistModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      await expect(getSpecialistBySlug("non-existent-slug")).rejects.toThrow("Specialist not found");
    });
  });

  // ====================================
  // CREATE SPECIALIST TESTS
  // ====================================
  describe("createSpecialist", () => {
    it("should create specialist successfully", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(null);
      (SpecialistModel.create as jest.Mock).mockResolvedValue(specialist);

      const specialistData = {
        name: "Software Engineering",
        slug: "software-engineering",
        description: "Software development practices",
        majorId,
        isActive: true,
      };

      const result = await createSpecialist(specialistData);

      expect(result).toBeDefined();
      expect(SpecialistModel.create).toHaveBeenCalledWith(specialistData);
    });

    it("should throw error when specialist with same name already exists", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(specialist);

      const specialistData = {
        name: "Software Engineering",
        slug: "software-engineering-2",
        description: "Software development",
        majorId,
      };

      await expect(createSpecialist(specialistData)).rejects.toThrow(
        "Specialist with this name already exists"
      );
    });

    it("should throw error when specialist with same slug already exists", async () => {
      (SpecialistModel.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // First call for name check
        .mockResolvedValueOnce(specialist); // Second call for slug check

      const specialistData = {
        name: "New Specialist",
        slug: "software-engineering",
        description: "New description",
        majorId,
      };

      await expect(createSpecialist(specialistData)).rejects.toThrow(
        "Specialist with this slug already exists"
      );
    });
  });

  // ====================================
  // UPDATE SPECIALIST BY ID TESTS
  // ====================================
  describe("updateSpecialistById", () => {
    it("should update specialist successfully", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);

      const updateData = { description: "Updated description" };
      await updateSpecialistById(specialistId.toString(), updateData);

      expect(SpecialistModel.findById).toHaveBeenCalledWith(specialistId.toString());
      expect(specialist.save).toHaveBeenCalled();
    });

    it("should throw error when specialist not found", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(null);

      const updateData = { name: "Updated Specialist" };
      await expect(updateSpecialistById(specialistId.toString(), updateData)).rejects.toThrow(
        "Specialist not found"
      );
    });

    it("should throw error when updating to existing name", async () => {
      const existingSpecialist = { ...specialist, name: "Existing Specialist" };
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(existingSpecialist);

      const updateData = { name: "Existing Specialist" };
      await expect(updateSpecialistById(specialistId.toString(), updateData)).rejects.toThrow(
        "Specialist with this name already exists"
      );
    });

    it("should throw error when updating to existing slug", async () => {
      const existingSpecialist = { ...specialist, _id: new mongoose.Types.ObjectId(), slug: "existing-slug" };
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(existingSpecialist);

      const updateData = { slug: "existing-slug" };
      await expect(updateSpecialistById(specialistId.toString(), updateData)).rejects.toThrow(
        "Specialist with this slug already exists"
      );
    });

    it("should allow updating to same name", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);

      const updateData = { name: "Software Engineering", description: "New description" };
      await updateSpecialistById(specialistId.toString(), updateData);

      expect(specialist.save).toHaveBeenCalled();
    });

    it("should allow updating to same slug", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);

      const updateData = { slug: "software-engineering", description: "New description" };
      await updateSpecialistById(specialistId.toString(), updateData);

      expect(specialist.save).toHaveBeenCalled();
    });

    it("should validate major exists when updating majorId", async () => {
      const newMajorId = new mongoose.Types.ObjectId();
      const mockMajor = { _id: newMajorId, name: "New Major" };
      (SpecialistModel.findById as jest.Mock)
        .mockResolvedValueOnce(specialist) // First call for specialist
        .mockResolvedValueOnce(mockMajor); // Second call for major validation

      const updateData = { majorId: newMajorId };
      await updateSpecialistById(specialistId.toString(), updateData);

      expect(specialist.save).toHaveBeenCalled();
    });

    it("should throw error when major not found during update", async () => {
      const newMajorId = new mongoose.Types.ObjectId();
      (SpecialistModel.findById as jest.Mock)
        .mockResolvedValueOnce(specialist) // First call for specialist
        .mockResolvedValueOnce(null); // Second call for major validation

      const updateData = { majorId: newMajorId };
      await expect(updateSpecialistById(specialistId.toString(), updateData)).rejects.toThrow(
        "Major not found"
      );
    });

    it("should not validate major when majorId is not changing", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);

      const updateData = { majorId, description: "Updated description" };
      await updateSpecialistById(specialistId.toString(), updateData);

      // findById should only be called once (for specialist, not for major validation)
      expect(SpecialistModel.findById).toHaveBeenCalledTimes(1);
      expect(specialist.save).toHaveBeenCalled();
    });
  });

  // ====================================
  // UPDATE SPECIALIST BY SLUG TESTS
  // ====================================
  describe("updateSpecialistBySlug", () => {
    it("should update specialist by slug successfully", async () => {
      const mockSpecialist = {
        ...specialist,
        save: jest.fn().mockResolvedValue(true),
      };
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(mockSpecialist);

      const updateData = { description: "Updated description" };
      await updateSpecialistBySlug("software-engineering", updateData);

      expect(SpecialistModel.findOne).toHaveBeenCalledWith({ slug: "software-engineering" });
      expect(mockSpecialist.save).toHaveBeenCalled();
    });

    it("should throw error when specialist not found by slug", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(null);

      const updateData = { name: "Updated Specialist" };
      await expect(updateSpecialistBySlug("non-existent-slug", updateData)).rejects.toThrow(
        "Specialist not found"
      );
    });

    it("should throw error when updating to existing name", async () => {
      const existingSpecialist = { ...specialist, name: "Existing Specialist" };
      (SpecialistModel.findOne as jest.Mock)
        .mockResolvedValueOnce(specialist) // First call for finding by slug
        .mockResolvedValueOnce(existingSpecialist); // Second call for name check

      const updateData = { name: "Existing Specialist" };
      await expect(updateSpecialistBySlug("software-engineering", updateData)).rejects.toThrow(
        "Specialist with this name already exists"
      );
    });

    it("should throw error when updating to existing slug", async () => {
      const existingSpecialist = { ...specialist, _id: new mongoose.Types.ObjectId(), slug: "existing-slug" };
      (SpecialistModel.findOne as jest.Mock)
        .mockResolvedValueOnce(specialist) // Finding by slug
        .mockResolvedValueOnce(existingSpecialist); // Slug check

      const updateData = { slug: "existing-slug" };
      await expect(updateSpecialistBySlug("software-engineering", updateData)).rejects.toThrow(
        "Specialist with this slug already exists"
      );
    });

    it("should validate major exists when updating majorId by slug", async () => {
      const newMajorId = new mongoose.Types.ObjectId();
      const mockMajor = { _id: newMajorId, name: "New Major" };
      const mockSpecialist = {
        ...specialist,
        save: jest.fn().mockResolvedValue(true),
      };
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(mockSpecialist);
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(mockMajor);

      const updateData = { majorId: newMajorId };
      await updateSpecialistBySlug("software-engineering", updateData);

      expect(mockSpecialist.save).toHaveBeenCalled();
    });

    it("should throw error when major not found during update by slug", async () => {
      const newMajorId = new mongoose.Types.ObjectId();
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(specialist);
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(null);

      const updateData = { majorId: newMajorId };
      await expect(updateSpecialistBySlug("software-engineering", updateData)).rejects.toThrow(
        "Major not found"
      );
    });
  });

  // ====================================
  // DELETE SPECIALIST BY ID TESTS
  // ====================================
  describe("deleteSpecialistById", () => {
    it("should delete specialist successfully when no dependencies exist", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (SpecialistModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteSpecialistById(specialistId.toString());

      expect(result).toBeDefined();
      expect(SpecialistModel.deleteOne).toHaveBeenCalledWith({ _id: specialistId.toString() });
    });

    it("should throw error when specialist not found", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(deleteSpecialistById(specialistId.toString())).rejects.toThrow("Specialist not found");
    });

    it("should throw error when teachers are using the specialist", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(3);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await expect(deleteSpecialistById(specialistId.toString())).rejects.toThrow(
        "Cannot delete specialist"
      );
    });

    it("should throw error when courses are using the specialist", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(5);

      await expect(deleteSpecialistById(specialistId.toString())).rejects.toThrow(
        "Cannot delete specialist"
      );
    });

    it("should throw error when both teachers and courses are using the specialist", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(2);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(3);

      await expect(deleteSpecialistById(specialistId.toString())).rejects.toThrow(
        "Cannot delete specialist"
      );
    });

    it("should check for teachers with correct query", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (SpecialistModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await deleteSpecialistById(specialistId.toString());

      expect(UserModel.countDocuments).toHaveBeenCalledWith({
        role: Role.TEACHER,
        specialistIds: { $in: specialistId.toString() },
      });
    });

    it("should check for courses with correct query", async () => {
      (SpecialistModel.findById as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (SpecialistModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await deleteSpecialistById(specialistId.toString());

      expect(CourseModel.countDocuments).toHaveBeenCalledWith({
        specialistIds: { $in: specialistId.toString() },
      });
    });
  });

  // ====================================
  // DELETE SPECIALIST BY SLUG TESTS
  // ====================================
  describe("deleteSpecialistBySlug", () => {
    it("should delete specialist by slug successfully when no dependencies exist", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (SpecialistModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteSpecialistBySlug("software-engineering");

      expect(result).toBeDefined();
      expect(SpecialistModel.deleteOne).toHaveBeenCalledWith({ slug: "software-engineering" });
    });

    it("should throw error when specialist not found by slug", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(deleteSpecialistBySlug("non-existent-slug")).rejects.toThrow("Specialist not found");
    });

    it("should throw error when teachers are using the specialist", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(2);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await expect(deleteSpecialistBySlug("software-engineering")).rejects.toThrow(
        "Cannot delete specialist"
      );
    });

    it("should throw error when courses are using the specialist", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(4);

      await expect(deleteSpecialistBySlug("software-engineering")).rejects.toThrow(
        "Cannot delete specialist"
      );
    });

    it("should throw error when both teachers and courses are using the specialist", async () => {
      (SpecialistModel.findOne as jest.Mock).mockResolvedValue(specialist);
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(1);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await expect(deleteSpecialistBySlug("software-engineering")).rejects.toThrow(
        "Cannot delete specialist"
      );
    });
  });
});

