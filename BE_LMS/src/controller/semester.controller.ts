import { CREATED, OK } from '@/constants/http';
import {
  createSemester,
  deleteSemester,
  listAllSemesters,
  updateSemester,
} from '@/services/semester.service';
import { catchErrors } from '@/utils/asyncHandler';
import {
  createSemesterSchema,
  semesterIdSchema,
  updateSemesterSchema,
} from '@/validators/semester.schemas';

// POST /semesters - Create a new semester
export const createSemesterHandler = catchErrors(async (req, res) => {
  const input = createSemesterSchema.parse(req.body);
  const data = await createSemester(input);
  return res.success(CREATED, {
    data,
    message: 'Semesters created successfully',
  });
});

// GET /semesters - List all semesters
export const listAllSemestersHandler = catchErrors(async (req, res) => {
  const data = await listAllSemesters();
  return res.success(OK, {
    data,
    message: 'Semesters retrieved successfully',
  });
});

// PUT /semesters/:semesterId - Update a semester
export const updateSemesterHandler = catchErrors(async (req, res) => {
  const semesterId = req.params.semesterId;
  const input = updateSemesterSchema.parse({
    semesterId,
    ...req.body,
  });

  const data = await updateSemester(input);
  return res.success(OK, {
    data,
    message: 'Semesters updated successfully',
  });
});

// DELETE /semesters/:semesterId - Delete a semester
export const deleteSemesterHandler = catchErrors(async (req, res) => {
  const semesterId = semesterIdSchema.parse(req.params.semesterId);
  const data = await deleteSemester(semesterId);

  return res.success(OK, {
    data,
    message: 'Semesters deleted successfully',
  });
});
