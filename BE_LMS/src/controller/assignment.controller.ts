  import { catchErrors } from "../utils/asyncHandler";
  import { CREATED, OK, BAD_REQUEST } from "../constants/http";
  import appAssert from "../utils/appAssert";
  import {
    listAssignmentsSchema,
    assignmentIdSchema,
    createAssignmentSchema,
    updateAssignmentSchema,
  } from "../validators/assignment.schemas";
  import {
    listAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  } from "../services/assignment.service";

  export const listAssignmentsHandler = catchErrors(async (req, res) => {
    const query = listAssignmentsSchema.parse(req.query);

    const result = await listAssignments({
      page: query.page,
      limit: query.limit,
      courseId: query.courseId as any,
      search: query.search,
      dueBefore: query.dueBefore,
      dueAfter: query.dueAfter,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      userId: req.userId,
      userRole: req.role,
    });

    return res.success(OK, {
      data: result.assignments,
      message: "Assignments retrieved successfully",
      pagination: result.pagination,
    });
  });

  export const getAssignmentByIdHandler = catchErrors(async (req, res) => {
    const assignmentId = assignmentIdSchema.parse(req.params.id);
    const assignment = await getAssignmentById(
      assignmentId,
      req.userId,
      req.role
    );

    return res.success(OK, {
      data: assignment,
      message: "Assignment retrieved successfully",
    });
  });

  export const createAssignmentHandler = catchErrors(async (req, res) => {
    const data = createAssignmentSchema.parse(req.body);

    const userId = req.userId;
    const userRole = req.role;
    const file = req.file as Express.Multer.File | undefined;

    const assignment = await createAssignment(
      data,
      userId,
      userRole,
      file
    );

    return res.success(CREATED, {
      data: assignment,
      message: "Assignment created successfully",
    });
  });

  export const updateAssignmentHandler = catchErrors(async (req, res) => {
    const assignmentId = assignmentIdSchema.parse(req.params.id);
    const data = updateAssignmentSchema.parse(req.body);
  const userId = req.userId;
  const userRole = req.role;

  const assignment = await updateAssignment(assignmentId, data, userId, userRole);

    return res.success(OK, {
      data: assignment,
      message: "Assignment updated successfully",
    });
  });

  export const deleteAssignmentHandler = catchErrors(async (req, res) => {
    const assignmentId = assignmentIdSchema.parse(req.params.id);
  const userId = req.userId;
  const userRole = req.role;

  await deleteAssignment(assignmentId, userId, userRole);

    return res.success(OK, {
      data: null,
      message: "Assignment deleted successfully",
    });
  });
