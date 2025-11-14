// Subject Service Unit Tests
import mongoose from "mongoose";

// Mock all models before importing services
jest.mock("@/models/subject.model");
jest.mock("@/models/course.model");
jest.mock("@/utils/appAssert");
jest.mock("@/models/user.model"); // Mock UserModel for updateSubjectById, deleteSubjectById, activateSubjectById, deactivateSubjectById, addPrerequisites, removePrerequisite

// Import models for mocking
import SubjectModel from "@/models/subject.model";
import CourseModel from "@/models/course.model";
import appAssert from "@/utils/appAssert";
import UserModel from "@/models/user.model";
import { Role } from "@/types";

// Import services
import {
  listSubjects,
  getSubjectById,
  getSubjectBySlug,
  createSubject,
  updateSubjectById,
  updateSubjectBySlug,
  deleteSubjectById,
  deleteSubjectBySlug,
  activateSubjectById,
  deactivateSubjectById,
  addPrerequisites,
  removePrerequisite,
  listPrerequisites,
  searchSubjectsAutocomplete,
  getRelatedSubjects,
} from "@/services/subject.service";

describe("📖 Subject Service Unit Tests", () => {
  let subject: any;
  let specialistId: any;

  beforeEach(() => {
    specialistId = new mongoose.Types.ObjectId();
    
    subject = {
      _id: new mongoose.Types.ObjectId(),
      name: "Test Subject",
      code: "SUB001",
      slug: "test-subject",
      credits: 3,
      description: "Test description",
      specialistIds: [specialistId],
      isActive: true,
      prerequisites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

  // Reset all mocks including implementations
  jest.resetAllMocks();

    // appAssert: throw Error(message) when condition falsy to mimic real behavior
    (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
      if (!condition) throw new Error(message);
    });
  });

  describe("listSubjects", () => {
    it("should return paginated subjects", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([subject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SubjectModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await listSubjects({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("subjects");
      expect(result).toHaveProperty("pagination");
      expect(Array.isArray(result.subjects)).toBe(true);
      expect(SubjectModel.find).toHaveBeenCalled();
    });

    it("should filter by search term", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([subject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SubjectModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await listSubjects({ page: 1, limit: 10, search: "test" });

      expect(result).toBeDefined();
      expect(SubjectModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $text: { $search: "test" } })
      );
    });

    it("should filter by name", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([subject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SubjectModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await listSubjects({ page: 1, limit: 10, name: "Test Subject" });

      expect(SubjectModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Test Subject" })
      );
    });

    it("should filter by isActive", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([subject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SubjectModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await listSubjects({ page: 1, limit: 10, isActive: true });

      expect(SubjectModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it("should coerce isActive string and filter by slug/code", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([subject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SubjectModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await listSubjects({
        page: 2,
        limit: 5,
        slug: "test-slug",
        code: "SUB001",
        isActive: "false",
      });

      expect(SubjectModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "test-slug",
          code: "SUB001",
          isActive: false,
        })
      );
    });

    it("should convert specialistId to ObjectId and respect createdAt/updatedAt", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([subject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);
      (SubjectModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const date = new Date();
      await listSubjects({
        page: 1,
        limit: 10,
        specialistId: specialistId.toString(),
        createdAt: date,
        updatedAt: date,
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(SubjectModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          specialistIds: expect.any(mongoose.Types.ObjectId),
          createdAt: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
          updatedAt: date,
        })
      );

      const sortCall = (SubjectModel.find as jest.Mock).mock.results[0].value.sort as jest.Mock;
      expect(sortCall).toHaveBeenCalledWith({ name: 1 });
    });

    it("should apply createdAt range filters when provided", async () => {
      const fromDate = new Date("2024-03-01");
      const toDate = new Date("2024-03-31");
      (SubjectModel.find as jest.Mock).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toEqual(toDate);
        return {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([subject]),
        };
      });
      (SubjectModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await listSubjects({ page: 1, limit: 10, from: fromDate, to: toDate } as any);
      expect(result.subjects).toHaveLength(1);
    });
  });

  describe("getSubjectById", () => {
    it("should return subject by id", async () => {
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(subject),
      });

      const result = await getSubjectById(subject._id.toString());

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Subject");
      expect(SubjectModel.findById).toHaveBeenCalledWith(subject._id.toString());
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(getSubjectById("nonexistent")).rejects.toThrow("Subject not found");
    });
  });

  describe("getSubjectBySlug", () => {
    it("should return subject by slug", async () => {
      (SubjectModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(subject),
      });

      const result = await getSubjectBySlug("test-subject");

      expect(result).toBeDefined();
      expect(result.slug).toBe("test-subject");
      expect(SubjectModel.findOne).toHaveBeenCalledWith({ slug: "test-subject" });
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(getSubjectBySlug("nonexistent")).rejects.toThrow("Subject not found");
    });
  });

  describe("createSubject", () => {
    it("should create subject successfully", async () => {
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(null); // No existing subject
      (SubjectModel.create as jest.Mock).mockResolvedValue(subject);

      const subjectData = {
        name: "New Subject",
        code: "SUB002",
        credits: 3,
        specialistIds: [specialistId],
      };

      const result = await createSubject(subjectData as any, "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(SubjectModel.create).toHaveBeenCalled();
    });

    it("should throw error when subject with same name exists", async () => {
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(subject); // Existing subject

      const subjectData = {
        name: "Test Subject",
        code: "SUB002",
        credits: 3,
      };

      await expect(createSubject(subjectData as any, "adminId", Role.ADMIN)).rejects.toThrow(
        "Subject with this name already exists"
      );
    });

    it("should throw error when subject with same code exists", async () => {
      // Mock findOne to return null for name check, then subject for code check
      (SubjectModel.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // No existing by name
        .mockResolvedValueOnce(subject); // Existing by code (slug check is skipped if no slug in data)

      const subjectData = {
        name: "New Subject",
        code: "SUB001",
        credits: 3,
        // No slug, so slug check is skipped
      };

      await expect(createSubject(subjectData as any, "adminId", Role.ADMIN)).rejects.toThrow(
        "Subject with this code already exists"
      );
    });

    it("should throw error when subject with same slug exists", async () => {
      (SubjectModel.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // name check
        .mockResolvedValueOnce(subject); // slug conflict

      const subjectData = {
        name: "New Subject",
        slug: "test-subject",
        code: "SUB002",
        credits: 3,
      };

      await expect(createSubject(subjectData as any, "adminId", Role.ADMIN)).rejects.toThrow(
        "Subject with this slug already exists"
      );
    });

    it("should allow teacher to create subject with assigned specialists", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [specialistId] })
      );
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(null);
      (SubjectModel.create as jest.Mock).mockResolvedValue(subject);

      const result = await createSubject(
        {
          ...subject,
          specialistIds: [specialistId],
        } as any,
        teacherId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(UserModel.findById).toHaveBeenCalledWith(teacherId);
      expect(SubjectModel.create).toHaveBeenCalled();
    });

    it("should forbid teacher creating subject with unassigned specialist", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [new mongoose.Types.ObjectId()] })
      );

      await expect(
        createSubject(
          {
            ...subject,
            specialistIds: [specialistId],
          } as any,
          teacherId,
          Role.TEACHER
        )
      ).rejects.toThrow("You can only create subjects with specialists you are assigned to");
    });

  it("should allow teacher to create subject without assigning specialists", async () => {
    const teacherId = new mongoose.Types.ObjectId().toString();
    (UserModel.findById as jest.Mock).mockReturnValue(
      mockUserLean({ specialistIds: [specialistId] })
    );
    (SubjectModel.findOne as jest.Mock).mockResolvedValue(null);
    (SubjectModel.create as jest.Mock).mockResolvedValue(subject);

    const result = await createSubject(
      {
        name: "Another Subject",
        code: "SUB003",
        credits: 3,
        specialistIds: [],
      } as any,
      teacherId,
      Role.TEACHER
    );

    expect(result).toBeDefined();
    expect(SubjectModel.create).toHaveBeenCalled();
  });

  it("should throw error when teacher has no assigned specialists", async () => {
    const teacherId = new mongoose.Types.ObjectId().toString();
    (UserModel.findById as jest.Mock).mockReturnValue(
      mockUserLean({ specialistIds: [] })
    );

    await expect(
      createSubject(
        {
          name: "Another Subject",
          code: "SUB004",
          credits: 3,
          specialistIds: [specialistId],
        } as any,
        teacherId,
        Role.TEACHER
      )
    ).rejects.toThrow("Teacher must be assigned to at least one specialist");
  });
  });

  describe("updateSubjectById", () => {
    it("should update subject successfully", async () => {
      const mockSubject = {
        ...subject,
        name: "Old Name", // Different from updateData.name
        save: jest.fn().mockResolvedValue({ ...subject, name: "Updated Subject" }),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      // When name is different, it checks for conflict - return null (no conflict)
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(null);

      const updateData = { name: "Updated Subject" };

      const result = await updateSubjectById(subject._id.toString(), updateData, "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(updateSubjectById("nonexistent", { name: "Updated" }, "adminId", Role.ADMIN)).rejects.toThrow(
        "Subject not found"
      );
    });

    it("should throw error when name conflict exists", async () => {
      const mockSubject = {
        ...subject,
        name: "Old Name",
        save: jest.fn(),
      };
      const conflictingSubject = { _id: new mongoose.Types.ObjectId(), name: "Updated Subject" };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(conflictingSubject);

      await expect(
        updateSubjectById(subject._id.toString(), { name: "Updated Subject" }, "adminId", Role.ADMIN)
      ).rejects.toThrow("Subject with this name already exists");
    });

    it("should allow teacher with matching specialist to update", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        save: jest.fn().mockResolvedValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await updateSubjectById(
        subject._id.toString(),
        { name: "Updated" },
        teacherId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(UserModel.findById).toHaveBeenCalled();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should forbid teacher updating subject with unassigned specialistIds", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockSubject = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
        save: jest.fn(),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [new mongoose.Types.ObjectId()] })
      );

      await expect(
        updateSubjectById(
          subject._id.toString(),
          { specialistIds: [specialistId] } as any,
          teacherId,
          Role.TEACHER
        )
    ).rejects.toThrow("You can only manage subjects assigned to your specialists");
    });

    it("should allow teacher to clear specialistIds", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        save: jest.fn().mockResolvedValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await updateSubjectById(
        subject._id.toString(),
        { specialistIds: [] } as any,
        teacherId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when teacher user not found", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockSubject = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
        save: jest.fn(),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean(null));

      await expect(
        updateSubjectById(subject._id.toString(), { name: "New" }, teacherId, Role.TEACHER)
      ).rejects.toThrow("User not found");
    });

    it("should forbid student from updating subject", async () => {
      const studentId = new mongoose.Types.ObjectId().toString();
      const mockSubject = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
        save: jest.fn(),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      await expect(
        updateSubjectById(subject._id.toString(), { name: "New" }, studentId, Role.STUDENT)
      ).rejects.toThrow("Only admin and teacher can access this resource");
    });
  });

  describe("updateSubjectBySlug", () => {
    it("should update subject successfully", async () => {
      const mockSubject = {
        ...subject,
        save: jest.fn().mockResolvedValue(subject),
      };
      (SubjectModel.findOne as jest.Mock)
        .mockResolvedValueOnce(mockSubject) // Find by slug
        .mockResolvedValueOnce(null); // No conflict

      const updateData = { name: "Updated Subject" };

      const result = await updateSubjectBySlug("test-subject", updateData, "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(updateSubjectBySlug("nonexistent", { name: "Updated" }, "adminId", Role.ADMIN)).rejects.toThrow(
        "Subject not found"
      );
    });

    it("should allow teacher with access to update by slug", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        save: jest.fn().mockResolvedValue(subject),
      };
      const findOneMock = SubjectModel.findOne as jest.Mock;
      findOneMock.mockResolvedValueOnce(mockSubject);
      findOneMock.mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );

      const result = await updateSubjectBySlug(
        "test-subject",
        { code: "NEWSUB" },
        teacherId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should forbid teacher updating subject by slug without permission", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockSubject = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
        save: jest.fn(),
      };
      (SubjectModel.findOne as jest.Mock)
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [new mongoose.Types.ObjectId()] })
      );

      await expect(
        updateSubjectBySlug("test-subject", { name: "Updated" }, teacherId, Role.TEACHER)
      ).rejects.toThrow("You can only manage subjects assigned to your specialists");
    });

    it("should allow teacher to update specialistIds when assigned", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        save: jest.fn().mockResolvedValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean({ specialistIds: [teacherSpecialist] }));
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await updateSubjectById(
        subject._id.toString(),
        { specialistIds: [teacherSpecialist] } as any,
        teacherId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when slug conflict exists", async () => {
      const mockSubject = {
        ...subject,
        save: jest.fn(),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean({ specialistIds: [] }));
      (SubjectModel.findOne as jest.Mock).mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
      });

      await expect(
        updateSubjectById(subject._id.toString(), { slug: "new-slug" }, "adminId", Role.ADMIN)
      ).rejects.toThrow("Subject with this slug already exists");
    });

    it("should throw error when code conflict exists", async () => {
      const mockSubject = {
        ...subject,
        save: jest.fn(),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean({ specialistIds: [] }));
      (SubjectModel.findOne as jest.Mock).mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
      });

      await expect(
        updateSubjectById(subject._id.toString(), { code: "NEWCODE" }, "adminId", Role.ADMIN)
      ).rejects.toThrow("Subject with this code already exists");
    });

    it("should allow teacher to update specialistIds by slug when assigned", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        save: jest.fn().mockResolvedValue(subject),
      };
      const findOneMock = SubjectModel.findOne as jest.Mock;
      findOneMock.mockResolvedValueOnce(mockSubject);
      findOneMock.mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );

      const result = await updateSubjectBySlug(
        "test-subject",
        { specialistIds: [teacherSpecialist] } as any,
        teacherId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should allow teacher to clear specialistIds by slug", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        save: jest.fn().mockResolvedValue(subject),
      };
      const findOneMock = SubjectModel.findOne as jest.Mock;
      findOneMock.mockResolvedValueOnce(mockSubject);
      findOneMock.mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );

      const result = await updateSubjectBySlug(
        "test-subject",
        { specialistIds: [] } as any,
        teacherId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when teacher user not found for slug update", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockSubject = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
        save: jest.fn(),
      };
      const findOneMock = SubjectModel.findOne as jest.Mock;
      findOneMock.mockResolvedValueOnce(mockSubject);
      findOneMock.mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean(null));

      await expect(
        updateSubjectBySlug("test-subject", { name: "Updated" }, teacherId, Role.TEACHER)
      ).rejects.toThrow("User not found");
    });

    it("should throw error when slug update conflicts existing subject", async () => {
      const mockSubject = {
        ...subject,
        save: jest.fn(),
      };
      const findOneMock = SubjectModel.findOne as jest.Mock;
      findOneMock.mockResolvedValueOnce(mockSubject);
      findOneMock.mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() });
      findOneMock.mockResolvedValue(null);

      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean({ specialistIds: [] }));

      await expect(
        updateSubjectBySlug("test-subject", { slug: "dup-slug" }, "adminId", Role.ADMIN)
      ).rejects.toThrow("Subject with this slug already exists");
    });

    it("should throw error when code conflict exists for slug update", async () => {
      const mockSubject = {
        ...subject,
        save: jest.fn(),
      };
      const findOneMock = SubjectModel.findOne as jest.Mock;
      findOneMock.mockResolvedValueOnce(mockSubject); // initial fetch
      findOneMock.mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() }); // code conflict
      findOneMock.mockResolvedValue(null);
      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean({ specialistIds: [] }));

      await expect(
        updateSubjectBySlug("test-subject", { code: "NEWCODE" }, "adminId", Role.ADMIN)
      ).rejects.toThrow("Subject with this code already exists");
    });
  });

  describe("deleteSubjectById", () => {
    it("should delete subject successfully when no courses use it", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (SubjectModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteSubjectById(subject._id.toString(), "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(SubjectModel.deleteOne).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(deleteSubjectById("nonexistent", "adminId", Role.ADMIN)).rejects.toThrow("Subject not found");
    });

    it("should throw error when courses are using the subject", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(2);

      await expect(deleteSubjectById(subject._id.toString(), "adminId", Role.ADMIN)).rejects.toThrow(
        "Cannot delete subject"
      );
    });

    it("should allow teacher with permission to delete", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const subjectDoc = {
        ...subject,
        specialistIds: [teacherSpecialist],
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectDoc);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (SubjectModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteSubjectById(subject._id.toString(), teacherId, Role.TEACHER);

      expect(result).toBeDefined();
      expect(SubjectModel.deleteOne).toHaveBeenCalled();
    });

    it("should forbid teacher without specialist access from deleting", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const subjectDoc = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectDoc);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [] })
      );

      await expect(
        deleteSubjectById(subject._id.toString(), teacherId, Role.TEACHER)
      ).rejects.toThrow("Teacher must be assigned to at least one specialist");
    });
  });

  describe("deleteSubjectBySlug", () => {
    it("should delete subject successfully when no courses use it", async () => {
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(subject);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (SubjectModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteSubjectBySlug("test-subject", "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(SubjectModel.deleteOne).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(deleteSubjectBySlug("nonexistent", "adminId", Role.ADMIN)).rejects.toThrow("Subject not found");
    });

    it("should forbid teacher deleting subject by slug if unassigned", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const subjectDoc = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
      };
      (SubjectModel.findOne as jest.Mock).mockResolvedValue(subjectDoc);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [] })
      );

      await expect(
        deleteSubjectBySlug("test-subject", teacherId, Role.TEACHER)
      ).rejects.toThrow("Teacher must be assigned to at least one specialist");
    });
  });

  describe("activateSubjectById", () => {
    it("should activate subject successfully", async () => {
      const mockSubject = {
        ...subject,
        isActive: false,
        save: jest.fn().mockResolvedValue({ ...subject, isActive: true }),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      const result = await activateSubjectById(subject._id.toString(), "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(mockSubject.isActive).toBe(true);
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(activateSubjectById("nonexistent", "adminId", Role.ADMIN)).rejects.toThrow("Subject not found");
    });

    it("should forbid teacher without specialists from activating", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const subjectDoc = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectDoc);
      (UserModel.findById as jest.Mock).mockReturnValue(mockUserLean(null));

      await expect(
        activateSubjectById(subject._id.toString(), teacherId, Role.TEACHER)
      ).rejects.toThrow("User not found");
    });
  });

  describe("deactivateSubjectById", () => {
    it("should deactivate subject successfully", async () => {
      const mockSubject = {
        ...subject,
        isActive: true,
        save: jest.fn().mockResolvedValue({ ...subject, isActive: false }),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      const result = await deactivateSubjectById(subject._id.toString(), "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(mockSubject.isActive).toBe(false);
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(deactivateSubjectById("nonexistent", "adminId", Role.ADMIN)).rejects.toThrow("Subject not found");
    });

    it("should forbid teacher without matching specialist from deactivating", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const subjectDoc = {
        ...subject,
        specialistIds: [new mongoose.Types.ObjectId()],
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectDoc);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [new mongoose.Types.ObjectId()] })
      );

      await expect(
        deactivateSubjectById(subject._id.toString(), teacherId, Role.TEACHER)
      ).rejects.toThrow("You can only manage subjects assigned to your specialists");
    });
  });

  describe("addPrerequisites", () => {
    it("should add prerequisites successfully", async () => {
      const prerequisiteId = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        prerequisites: [],
        save: jest.fn().mockResolvedValue(subject),
        toObject: jest.fn().mockReturnValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      const result = await addPrerequisites(subject._id.toString(), [prerequisiteId.toString()], "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should skip self-reference", async () => {
      const mockSubject = {
        ...subject,
        prerequisites: [],
        save: jest.fn().mockResolvedValue(subject),
        toObject: jest.fn().mockReturnValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      const result = await addPrerequisites(subject._id.toString(), [subject._id.toString()], "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      // Should not add self as prerequisite
    });

    it("should avoid adding duplicate prerequisites", async () => {
      const existingPrereq = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        prerequisites: [existingPrereq],
        save: jest.fn().mockResolvedValue(subject),
        toObject: jest.fn().mockReturnValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      await addPrerequisites(
        subject._id.toString(),
        [existingPrereq.toString()],
        "adminId",
        Role.ADMIN
      );

      expect(mockSubject.prerequisites).toHaveLength(1);
      expect(mockSubject.prerequisites[0]).toEqual(existingPrereq);
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(addPrerequisites("nonexistent", ["123"], "adminId", Role.ADMIN)).rejects.toThrow("Subject not found");
    });

    it("should enforce permission when teacher adds prerequisites", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        prerequisites: [],
        save: jest.fn().mockResolvedValue(subject),
        toObject: jest.fn().mockReturnValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );

      await addPrerequisites(
        subject._id.toString(),
        [new mongoose.Types.ObjectId().toString()],
        teacherId,
        Role.TEACHER
      );

      expect(UserModel.findById).toHaveBeenCalled();
      expect(mockSubject.save).toHaveBeenCalled();
    });
  });

  describe("removePrerequisite", () => {
    it("should remove prerequisite successfully", async () => {
      const prerequisiteId = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        prerequisites: [prerequisiteId],
        save: jest.fn().mockResolvedValue(subject),
        toObject: jest.fn().mockReturnValue({ ...subject, prerequisites: [] }),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      const result = await removePrerequisite(subject._id.toString(), prerequisiteId.toString(), "adminId", Role.ADMIN);

      expect(result).toBeDefined();
      expect(mockSubject.save).toHaveBeenCalled();
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(removePrerequisite("nonexistent", "123", "adminId", Role.ADMIN)).rejects.toThrow("Subject not found");
    });

    it("should enforce permission when teacher removes prerequisite", async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      const teacherSpecialist = new mongoose.Types.ObjectId();
      const prerequisiteId = new mongoose.Types.ObjectId();
      const mockSubject = {
        ...subject,
        specialistIds: [teacherSpecialist],
        prerequisites: [prerequisiteId],
        save: jest.fn().mockResolvedValue(subject),
        toObject: jest.fn().mockReturnValue(subject),
      };
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (UserModel.findById as jest.Mock).mockReturnValue(
        mockUserLean({ specialistIds: [teacherSpecialist] })
      );

      await removePrerequisite(subject._id.toString(), prerequisiteId.toString(), teacherId, Role.TEACHER);

      expect(UserModel.findById).toHaveBeenCalled();
      expect(mockSubject.save).toHaveBeenCalled();
    });
  });

  describe("listPrerequisites", () => {
    it("should return prerequisites list", async () => {
      const prerequisite = { _id: new mongoose.Types.ObjectId(), name: "Prerequisite 1" };
      const mockSubject = {
        ...subject,
        prerequisites: [prerequisite],
      };
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSubject),
        }),
      });

      const result = await listPrerequisites(subject._id.toString());

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(listPrerequisites("nonexistent")).rejects.toThrow("Subject not found");
    });

    it("should return empty array when subject has no prerequisites", async () => {
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ ...subject, prerequisites: undefined }),
        }),
      });

      const result = await listPrerequisites(subject._id.toString());
      expect(result).toEqual([]);
    });
  });

  describe("searchSubjectsAutocomplete", () => {
    it("should return autocomplete results", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([subject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await searchSubjectsAutocomplete("test", 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(SubjectModel.find).toHaveBeenCalled();
    });

    it("should return empty array when query is empty", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await searchSubjectsAutocomplete("", 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getRelatedSubjects", () => {
    it("should return related subjects", async () => {
      const relatedSubject = {
        _id: new mongoose.Types.ObjectId(),
        name: "Related Subject",
        specialistIds: [specialistId],
      };
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(subject),
      });
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([relatedSubject]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await getRelatedSubjects(subject._id.toString(), 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(getRelatedSubjects("nonexistent", 10)).rejects.toThrow("Subject not found");
    });

    it("should handle subjects without specialistIds", async () => {
      const prereqId = new mongoose.Types.ObjectId();
      (SubjectModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...subject,
          specialistIds: undefined,
          prerequisites: [prereqId],
        }),
      });
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (SubjectModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await getRelatedSubjects(subject._id.toString(), 5);
      expect(result).toEqual([]);
      expect(SubjectModel.find).toHaveBeenCalled();
    });
  });
});

const mockUserLean = (data: any) => ({
  lean: jest.fn().mockResolvedValue(data),
});

