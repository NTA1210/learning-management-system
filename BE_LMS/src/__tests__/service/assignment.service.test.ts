import AssignmentModel from "@/models/assignment.model";
import CourseModel from "@/models/course.model";
import appAssert from "@/utils/appAssert";
import {
  listAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/services/assignment.service";

//  Mock các module
jest.mock("@/models/assignment.model");
jest.mock("@/models/course.model");
jest.mock("@/utils/appAssert");
// test list assignments
describe("Assignments API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GET /assignments", () => {
    it("should return paginated assignments", async () => {
      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ title: "Math HW" }]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(1);

      const result = await listAssignments({ page: 1, limit: 10 });

      console.log(result);
      expect(result.assignments).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(AssignmentModel.find).toHaveBeenCalled();
    });
  });
  // assignment detail
  describe("GET /assignments/:id", () => {
    it("should return assignment when found", async () => {
      const mockAssignment = { _id: "1", title: "Math HW" };
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAssignment),
      });

      const result = await getAssignmentById("1");
      console.log("PATH: /assignments/:id", result);
      console.log(
        "findById called with:",
        (AssignmentModel.findById as jest.Mock).mock.calls
      );
      expect(result).toEqual(mockAssignment);
    });

    it("should call appAssert when not found", async () => {
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      await getAssignmentById("999");

      console.log("appAssert calls:", (appAssert as jest.Mock).mock.calls);
      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Assignment not found"
      );
    });
  });
  //creat assignments
  describe("POST /assignments", () => {
    it("should create assignment when course exists", async () => {
      (CourseModel.findById as any).mockResolvedValue({ _id: "C1" });
      (AssignmentModel.create as any).mockResolvedValue({ _id: "A1" });
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: "A1", title: "Test HW" }),
      });

      const result = await createAssignment({
        title: "Test HW",
        courseId: "C1",
      });

      expect(result!._id).toBe("A1");
      expect(CourseModel.findById).toHaveBeenCalledWith("C1");
      expect(AssignmentModel.create).toHaveBeenCalled();
    });

    it("should call appAssert if course not found", async () => {
      (CourseModel.findById as any).mockResolvedValue(null);

      await createAssignment({ title: "Test", courseId: "invalid" });

      console.log("appAssert calls:", (appAssert as jest.Mock).mock.calls);
      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Course not found"
      );
    });
  });

  describe("updateAssignment", () => {
    it("should update assignment", async () => {
      const mockUpdated = { _id: "A1", title: "Updated HW" };
      (AssignmentModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      const result = await updateAssignment("A1", { title: "Updated HW" });
      expect(result).toEqual(mockUpdated);
    });

    it("should call appAssert if assignment not found", async () => {
      (AssignmentModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      await updateAssignment("404", { title: "Not Found" });
      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Assignment not found"
      );
    });
  });

  describe("deleteAssignment", () => {
    it("should delete assignment", async () => {
      (AssignmentModel.findByIdAndDelete as any).mockResolvedValue({
        _id: "A1",
      });
      const result = await deleteAssignment("A1");
      expect(result._id).toBe("A1");
    });

    it("should call appAssert if not found", async () => {
      (AssignmentModel.findByIdAndDelete as any).mockResolvedValue(null);
      await deleteAssignment("404");
      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Assignment not found"
      );
    });
  });
});
