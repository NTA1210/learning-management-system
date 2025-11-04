import { catchErrors } from "../utils/asyncHandler";
import { CREATED, OK } from "../constants/http";
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
    courseId: query.courseId,
    search: query.search,
    dueBefore: query.dueBefore,
    dueAfter: query.dueAfter,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return res.success(OK, {
    data: result.assignments,
    message: "Assignments retrieved successfully",
    pagination: result.pagination,
  });
});

export const getAssignmentByIdHandler = catchErrors(async (req, res) => {
  const assignmentId = assignmentIdSchema.parse(req.params.id);
  const assignment = await getAssignmentById(assignmentId);

  return res.success(OK, {
    data: assignment,
    message: "Assignment retrieved successfully",
  });
});

export const createAssignmentHandler = catchErrors(async (req, res) => {
  const data = createAssignmentSchema.parse(req.body);
  const assignment = await createAssignment(data);

  return res.success(CREATED, {
    data: assignment,
    message: "Assignment created successfully",
  });
});

export const updateAssignmentHandler = catchErrors(async (req, res) => {
  const assignmentId = assignmentIdSchema.parse(req.params.id);
  const data = updateAssignmentSchema.parse(req.body);
  const assignment = await updateAssignment(assignmentId, data);

  return res.success(OK, {
    data: assignment,
    message: "Assignment updated successfully",
  });
});

export const deleteAssignmentHandler = catchErrors(async (req, res) => {
  const assignmentId = assignmentIdSchema.parse(req.params.id);
  await deleteAssignment(assignmentId);

  return res.success(OK, {
    data: null,
    message: "Assignment deleted successfully",
  });
});