import { BAD_REQUEST, NOT_FOUND } from '@/constants/http';
import { CourseModel, SemesterModel } from '@/models';
import appAssert from '@/utils/appAssert';
import { ICreateSemesterParams, IUpdateSemesterParams } from '@/validators/semester.schemas';

/**
 * Create a new semester in the database.
 * @param  input - The input data for creating a semester.
 * @returns  - A promise that resolves with the created ISemester object.
 * @throws  - If a semester with the same year and type already exists.
 */
export const createSemester = async (input: ICreateSemesterParams) => {
  const existingSemester = await SemesterModel.findOne({ year: input.year, type: input.type });

  appAssert(!existingSemester, BAD_REQUEST, 'Semester already exists');

  const data = await SemesterModel.create(input);
  return data;
};

/**
 * List all semesters in the database.
 * Semesters are sorted by year in descending order and createdAt in descending order.
 * @returns  A promise that resolves with an array of ISemester objects.
 */
export const listAllSemesters = async () => {
  const data = await SemesterModel.find().sort({ year: -1, createdAt: -1 }).lean();

  return data;
};

/**
 * Update a semester in the database.
 * @param  input - The input data for updating a semester.
 * @returns  A promise that resolves with the updated ISemester object.
 * @throws  If a semester with the same year and type already exists.
 */
export const updateSemester = async (input: IUpdateSemesterParams) => {
  const { semesterId, type, year, startDate, endDate } = input;

  const semester = await SemesterModel.findById(semesterId);
  appAssert(semester, NOT_FOUND, 'Semester not found');

  // Prepare updated fields
  const newType = type ?? semester.type;
  const newYear = year ?? semester.year;

  // Check duplicate (exclude current)
  const existingSemester = await SemesterModel.findOne({
    year: newYear,
    type: newType,
    _id: { $ne: semesterId },
  });

  appAssert(!existingSemester, BAD_REQUEST, 'Semester already exists');

  // Apply changes
  semester.type = newType;
  semester.year = newYear;

  if (startDate) semester.startDate = startDate;
  if (endDate) semester.endDate = endDate;

  // Save & return updated document
  const updated = await semester.save();
  return updated;
};

/**
 * Delete a semester in the database.
 * @param  semesterId The ID of the semester to be deleted.
 * @returns  A promise that resolves with the deleted ISemester object.
 * @throws  If the semester has courses, it cannot be deleted.
 */
export const deleteSemester = async (semesterId: string) => {
  // 1. Check semester exists
  const semester = await SemesterModel.findById(semesterId);
  appAssert(semester, NOT_FOUND, 'Semester not found');

  // 2. Check if semester has courses
  const hasCourse = await CourseModel.exists({ semesterId });
  appAssert(!hasCourse, BAD_REQUEST, 'Semester has courses, can not delete');

  // 3. Delete
  const data = await SemesterModel.findByIdAndDelete(semesterId);
  return data;
};
