// Major Service Unit Tests
import mongoose from "mongoose";

// Mock all models before importing services
jest.mock("@/models/major.model");
jest.mock("@/models/specialist.model");
jest.mock("@/utils/appAssert");

// Import models for mocking
import MajorModel from "@/models/major.model";
import SpecialistModel from "@/models/specialist.model";
import appAssert from "@/utils/appAssert";

// Import services
import {
  listMajors,
  getMajorById,
  getMajorBySlug,
  createMajor,
  updateMajorById,
  updateMajorBySlug,
  deleteMajorById,
  deleteMajorBySlug,
  ListMajorParams,
} from "@/services/major.service";

describe("📚 Major Service Unit Tests", () => {
  let majorId: mongoose.Types.ObjectId;
  let major: any;

  beforeEach(() => {
    // Create mock IDs
    majorId = new mongoose.Types.ObjectId();

    // Create mock data
    major = {
      _id: majorId,
      name: "Computer Science",
      slug: "computer-science",
      description: "Study of computation and information",
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
  // LIST MAJORS TESTS
  // ====================================
  describe("listMajors", () => {
    it("should list majors with pagination", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([major]),
      };
      (MajorModel.find as jest.Mock).mockReturnValue(mockQuery);
      (MajorModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListMajorParams = {
        page: 1,
        limit: 10,
      };

      const result = await listMajors(params);

      expect(result).toBeDefined();
      expect(result.majors).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
      expect(MajorModel.find).toHaveBeenCalled();
    });

    it("should filter majors by search term", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([major]),
      };
      (MajorModel.find as jest.Mock).mockReturnValue(mockQuery);
      (MajorModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListMajorParams = {
        page: 1,
        limit: 10,
        search: "Computer",
      };

      const result = await listMajors(params);

      expect(result).toBeDefined();
      expect(MajorModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { title: { $regex: "Computer", $options: "i" } },
            { description: { $regex: "Computer", $options: "i" } },
          ],
        })
      );
    });

    it("should filter majors by name", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([major]),
      };
      (MajorModel.find as jest.Mock).mockReturnValue(mockQuery);
      (MajorModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListMajorParams = {
        page: 1,
        limit: 10,
        name: "Computer Science",
      };

      const result = await listMajors(params);

      expect(result).toBeDefined();
      expect(MajorModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Computer Science",
        })
      );
    });

    it("should filter majors by slug", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([major]),
      };
      (MajorModel.find as jest.Mock).mockReturnValue(mockQuery);
      (MajorModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListMajorParams = {
        page: 1,
        limit: 10,
        slug: "computer-science",
      };

      const result = await listMajors(params);

      expect(result).toBeDefined();
      expect(MajorModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "computer-science",
        })
      );
    });

    it("should filter majors by description", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([major]),
      };
      (MajorModel.find as jest.Mock).mockReturnValue(mockQuery);
      (MajorModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListMajorParams = {
        page: 1,
        limit: 10,
        description: "Study of computation",
      };

      const result = await listMajors(params);

      expect(result).toBeDefined();
      expect(MajorModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Study of computation",
        })
      );
    });

    it("should sort majors in ascending order", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([major]),
      };
      (MajorModel.find as jest.Mock).mockReturnValue(mockQuery);
      (MajorModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListMajorParams = {
        page: 1,
        limit: 10,
        sortBy: "name",
        sortOrder: "asc",
      };

      await listMajors(params);

      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
    });

    it("should calculate pagination correctly with multiple pages", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([major]),
      };
      (MajorModel.find as jest.Mock).mockReturnValue(mockQuery);
      (MajorModel.countDocuments as jest.Mock).mockResolvedValue(25);

      const params: ListMajorParams = {
        page: 2,
        limit: 10,
      };

      const result = await listMajors(params);

      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });
  });

  // ====================================
  // GET MAJOR BY ID TESTS
  // ====================================
  describe("getMajorById", () => {
    it("should get major by ID successfully", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(major),
      };
      (MajorModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await getMajorById(majorId.toString());

      expect(result).toBeDefined();
      expect(result.name).toBe("Computer Science");
      expect(MajorModel.findById).toHaveBeenCalledWith(majorId.toString());
    });

    it("should throw error when major not found", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (MajorModel.findById as jest.Mock).mockReturnValue(mockQuery);

      await expect(getMajorById(majorId.toString())).rejects.toThrow("Major not found");
    });
  });

  // ====================================
  // GET MAJOR BY SLUG TESTS
  // ====================================
  describe("getMajorBySlug", () => {
    it("should get major by slug successfully", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(major),
      };
      (MajorModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await getMajorBySlug("computer-science");

      expect(result).toBeDefined();
      expect(result.name).toBe("Computer Science");
      expect(MajorModel.findOne).toHaveBeenCalledWith({ slug: "computer-science" });
    });

    it("should throw error when major not found by slug", async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (MajorModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      await expect(getMajorBySlug("non-existent-slug")).rejects.toThrow("Major not found");
    });
  });

  // ====================================
  // CREATE MAJOR TESTS
  // ====================================
  describe("createMajor", () => {
    it("should create major successfully", async () => {
      (MajorModel.findOne as jest.Mock).mockResolvedValue(null);
      (MajorModel.create as jest.Mock).mockResolvedValue(major);

      const majorData = {
        name: "Computer Science",
        slug: "computer-science",
        description: "Study of computation",
      };

      const result = await createMajor(majorData);

      expect(result).toBeDefined();
      expect(MajorModel.create).toHaveBeenCalledWith(majorData);
    });

    it("should throw error when major with same name already exists", async () => {
      (MajorModel.findOne as jest.Mock).mockResolvedValue(major);

      const majorData = {
        name: "Computer Science",
        description: "Study of computation",
      };

      await expect(createMajor(majorData)).rejects.toThrow("Major with this name already exists");
    });

    it("should throw error when major with same slug already exists", async () => {
      (MajorModel.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // First call for name check
        .mockResolvedValueOnce(major); // Second call for slug check

      const majorData = {
        name: "New Major",
        slug: "computer-science",
        description: "New description",
      };

      await expect(createMajor(majorData)).rejects.toThrow("Major with this slug already exists");
    });

    it("should create major without slug", async () => {
      (MajorModel.findOne as jest.Mock).mockResolvedValue(null);
      (MajorModel.create as jest.Mock).mockResolvedValue(major);

      const majorData = {
        name: "Computer Science",
        description: "Study of computation",
      };

      const result = await createMajor(majorData);

      expect(result).toBeDefined();
      expect(MajorModel.create).toHaveBeenCalledWith(majorData);
    });
  });

  // ====================================
  // UPDATE MAJOR BY ID TESTS
  // ====================================
  describe("updateMajorById", () => {
    it("should update major successfully", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);

      const updateData = { description: "Updated description" };
      await updateMajorById(majorId.toString(), updateData);

      expect(MajorModel.findById).toHaveBeenCalledWith(majorId.toString());
      expect(major.save).toHaveBeenCalled();
    });

    it("should throw error when major not found", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(null);

      const updateData = { name: "Updated Major" };
      await expect(updateMajorById(majorId.toString(), updateData)).rejects.toThrow("Major not found");
    });

    it("should throw error when updating to existing name", async () => {
      const existingMajor = { ...major, name: "Existing Major" };
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);
      (MajorModel.findOne as jest.Mock).mockResolvedValue(existingMajor);

      const updateData = { name: "Existing Major" };
      await expect(updateMajorById(majorId.toString(), updateData)).rejects.toThrow(
        "Major with this name already exists"
      );
    });

    it("should throw error when updating to existing slug", async () => {
      const existingMajor = { ...major, _id: new mongoose.Types.ObjectId(), slug: "existing-slug" };
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);
      (MajorModel.findOne as jest.Mock).mockResolvedValue(existingMajor);

      const updateData = { slug: "existing-slug" };
      await expect(updateMajorById(majorId.toString(), updateData)).rejects.toThrow(
        "Major with this slug already exists"
      );
    });

    it("should allow updating to same name", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);

      const updateData = { name: "Computer Science", description: "New description" };
      await updateMajorById(majorId.toString(), updateData);

      expect(major.save).toHaveBeenCalled();
    });

    it("should allow updating to same slug", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);

      const updateData = { slug: "computer-science", description: "New description" };
      await updateMajorById(majorId.toString(), updateData);

      expect(major.save).toHaveBeenCalled();
    });
  });

  // ====================================
  // UPDATE MAJOR BY SLUG TESTS
  // ====================================
  describe("updateMajorBySlug", () => {
    it("should update major by slug successfully", async () => {
      const mockMajor = {
        ...major,
        save: jest.fn().mockResolvedValue(true),
      };
      (MajorModel.findOne as jest.Mock).mockResolvedValue(mockMajor);

      const updateData = { description: "Updated description" };
      await updateMajorBySlug("computer-science", updateData);

      expect(MajorModel.findOne).toHaveBeenCalledWith({ slug: "computer-science" });
      expect(mockMajor.save).toHaveBeenCalled();
    });

    it("should throw error when major not found by slug", async () => {
      (MajorModel.findOne as jest.Mock).mockResolvedValue(null);

      const updateData = { name: "Updated Major" };
      await expect(updateMajorBySlug("non-existent-slug", updateData)).rejects.toThrow("Major not found");
    });

    it("should throw error when updating to existing name", async () => {
      const existingMajor = { ...major, name: "Existing Major" };
      (MajorModel.findOne as jest.Mock)
        .mockResolvedValueOnce(major) // First call for finding by slug
        .mockResolvedValueOnce(existingMajor); // Second call for name check

      const updateData = { name: "Existing Major" };
      await expect(updateMajorBySlug("computer-science", updateData)).rejects.toThrow(
        "Major with this name already exists"
      );
    });

    it("should throw error when updating to existing slug", async () => {
      const existingMajor = { ...major, _id: new mongoose.Types.ObjectId(), slug: "existing-slug" };
      (MajorModel.findOne as jest.Mock)
        .mockResolvedValueOnce(major) // First call for finding by slug
        .mockResolvedValueOnce(existingMajor); // Second call for slug check

      const updateData = { slug: "existing-slug" };
      await expect(updateMajorBySlug("computer-science", updateData)).rejects.toThrow(
        "Major with this slug already exists"
      );
    });
  });

  // ====================================
  // DELETE MAJOR BY ID TESTS
  // ====================================
  describe("deleteMajorById", () => {
    it("should delete major successfully when no specialists exist", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (MajorModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteMajorById(majorId.toString());

      expect(result).toBeDefined();
      expect(MajorModel.deleteOne).toHaveBeenCalledWith({ _id: majorId.toString() });
    });

    it("should throw error when major not found", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(deleteMajorById(majorId.toString())).rejects.toThrow("Major not found");
    });

    it("should throw error when specialists are using the major (singular)", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await expect(deleteMajorById(majorId.toString())).rejects.toThrow(
        "Cannot delete major. 1 specialist is using this major."
      );
    });

    it("should throw error when specialists are using the major (plural)", async () => {
      (MajorModel.findById as jest.Mock).mockResolvedValue(major);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(5);

      await expect(deleteMajorById(majorId.toString())).rejects.toThrow(
        "Cannot delete major. 5 specialists are using this major."
      );
    });
  });

  // ====================================
  // DELETE MAJOR BY SLUG TESTS
  // ====================================
  describe("deleteMajorBySlug", () => {
    it("should delete major by slug successfully when no specialists exist", async () => {
      (MajorModel.findOne as jest.Mock).mockResolvedValue(major);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (MajorModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteMajorBySlug("computer-science");

      expect(result).toBeDefined();
      expect(MajorModel.deleteOne).toHaveBeenCalledWith({ slug: "computer-science" });
    });

    it("should throw error when major not found by slug", async () => {
      (MajorModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(deleteMajorBySlug("non-existent-slug")).rejects.toThrow("Major not found");
    });

    it("should throw error when specialists are using the major", async () => {
      (MajorModel.findOne as jest.Mock).mockResolvedValue(major);
      (SpecialistModel.countDocuments as jest.Mock).mockResolvedValue(3);

      await expect(deleteMajorBySlug("computer-science")).rejects.toThrow(
        "Cannot delete major. 3 specialist"
      );
    });
  });
});

