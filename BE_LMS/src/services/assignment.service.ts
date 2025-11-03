import AssignmentModel from "../models/assignment.model";
import CourseModel from "../models/course.model";
import appAssert from "../utils/appAssert";
import {NOT_FOUND} from "../constants/http";

export type ListAssignmentsParams = {
    page: number;
    limit: number;
    courseId?: string;
    search?: string;
    dueBefore?: Date;
    dueAfter?: Date;
    sortBy?: string;
    sortOrder?: string;
};

export const listAssignments = async ({
                                          page,
                                          limit,
                                          courseId,
                                          search,
                                          dueBefore,
                                          dueAfter,
                                          sortBy = "createdAt",
                                          sortOrder = "desc",
                                      }: ListAssignmentsParams) => {
    // Build filter query
    const filter: any = {};

    if (courseId) {
        filter.courseId = courseId;
    }

    if (search) {
        filter.$or = [
            {title: {$regex: search, $options: "i"}},
            {description: {$regex: search, $options: "i"}},
        ];
    }

    if (dueBefore) {
        filter.dueDate = {...filter.dueDate, $lte: dueBefore};
    }

    if (dueAfter) {
        filter.dueDate = {...filter.dueDate, $gte: dueAfter};
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [assignments, total] = await Promise.all([
        AssignmentModel.find(filter)
            .populate("courseId", "title code")
            .populate("createdBy", "username email fullname")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        AssignmentModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        assignments,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    };
};

export const getAssignmentById = async (assignmentId: string) => {
    const assignment = await AssignmentModel.findById(assignmentId)
        .populate("courseId", "title code")
        .populate("createdBy", "username email fullname")
        .lean();

    appAssert(assignment, NOT_FOUND, "Assignment not found");
    return assignment;
};

export const createAssignment = async (data: any) => {
    // Verify course exists
    const course = await CourseModel.findById(data.courseId);
    appAssert(course, NOT_FOUND, "Course not found");

    const assignment = await AssignmentModel.create(data);
    return await AssignmentModel.findById(assignment._id)
        .populate("courseId", "title code")
        .populate("createdBy", "username email fullname")
        .lean();
};

export const updateAssignment = async (assignmentId: string, data: any) => {
    const assignment = await AssignmentModel.findByIdAndUpdate(
        assignmentId,
        data,
        {new: true}
    )
        .populate("courseId", "title code")
        .populate("createdBy", "username email fullname")
        .lean();

    appAssert(assignment, NOT_FOUND, "Assignment not found");
    return assignment;
};

export const deleteAssignment = async (assignmentId: string) => {
    const assignment = await AssignmentModel.findByIdAndDelete(assignmentId);
    appAssert(assignment, NOT_FOUND, "Assignment not found");
    return assignment;
};
