import ClassModel from "../models/class.model";
import EnrollmentModel from "../models/enrollment.model";
import IClass, {ClassStatus} from "../types/class.type";
import {EnrollmentStatus} from "../types/enrollment.type";
import appAssert from "../utils/appAssert";
import {CONFLICT, NOT_FOUND} from "../constants/http";

export interface CreateClassInput {
    courseId: string;
    className: string;
    teacherIds: string[];
    capacity: number;
    semester?: string;
    academicYear?: string;
    classroom?: string;
    createdBy?: string;
}

export const createClass = async (input: CreateClassInput) => {
    // Check if class name already exists for this course
    const existingClass = await ClassModel.findOne({
        courseId: input.courseId,
        className: input.className,
    });

    appAssert(
        !existingClass,
        CONFLICT,
        "Class with this name already exists for the course"
    );

    return await ClassModel.create({
        ...input,
        status: ClassStatus.DRAFT,
        currentEnrollment: 0,
    });
};

export const getClassesByCourse = async (courseId: string, status?: string) => {
    const filter: any = {courseId};
    if (status) {
        filter.status = status;
    }

    return await ClassModel.find(filter)
        .populate("teacherIds", "fullname email avatar_url")
        .populate("courseId", "title description")
        .sort({createdAt: -1})
        .lean();
};

export const getClassById = async (classId: string) => {
    const classData = await ClassModel.findById(classId)
        .populate("teacherIds", "fullname email avatar_url")
        .populate("courseId", "title description startDate endDate")
        .populate("createdBy", "fullname email")
        .lean();

    appAssert(classData, NOT_FOUND, "Class not found");

    // Get current enrollment count
    const enrollmentCount = await EnrollmentModel.countDocuments({
        classId,
        status: EnrollmentStatus.APPROVED,
    });

    return {
        ...classData,
        actualEnrollment: enrollmentCount,
    };
};

export const updateClassById = async (classId: string, updates: Partial<IClass>) => {
    // Don't allow direct updates to currentEnrollment (managed by enrollment hooks)
    const updateData = {...updates};
    delete (updateData as any).currentEnrollment;

    const classData = await ClassModel.findById(classId);
    appAssert(classData, NOT_FOUND, "Class not found");

    // If updating className, check for conflicts
    if (updates.className && updates.className !== classData.className) {
        const existingClass = await ClassModel.findOne({
            courseId: classData.courseId,
            className: updates.className,
        });
        appAssert(!existingClass, CONFLICT, "Class with this name already exists for the course");
    }

    Object.assign(classData, updateData);
    await classData.save();

    return classData;
};

export const getTeacherClasses = async (
    teacherId: string,
    status?: string,
    semester?: string
) => {
    const filter: any = {teacherIds: teacherId};
    if (status) {
        filter.status = status;
    }
    if (semester) {
        filter.semester = semester;
    }

    const classes = await ClassModel.find(filter)
        .populate("courseId", "title description")
        .sort({semester: -1, createdAt: -1})
        .lean();

    return classes;
};

export const getStudentClasses = async (studentId: string) => {
    const enrollments = await EnrollmentModel.find({
        studentId,
        status: EnrollmentStatus.APPROVED,
    })
        .populate({
            path: "classId",
            populate: [
                {path: "courseId", select: "title description"},
                {path: "teacherIds", select: "fullname email avatar_url"},
            ],
        })
        .sort({createdAt: -1})
        .lean();

    return enrollments.map((enrollment: any) => enrollment.classId);
};

export const updateEnrollmentCount = async (classId: string) => {
    const count = await EnrollmentModel.countDocuments({
        classId,
        status: EnrollmentStatus.APPROVED,
    });

    await ClassModel.findByIdAndUpdate(classId, {
        currentEnrollment: count,
    });
};

/**
 * Check if class has capacity for new enrollment
 */
export const classHasCapacity = async (classId: string): Promise<boolean> => {
    const classData = await ClassModel.findById(classId);

    appAssert(classData, NOT_FOUND, "Class not found");

    const currentCount = await EnrollmentModel.countDocuments({
        classId,
        status: EnrollmentStatus.APPROVED,
    });

    return currentCount < classData.capacity;
};

export const deleteClassById = async (classId: string) => {
    const classData = await ClassModel.findById(classId);
    appAssert(classData, NOT_FOUND, "Class not found");

    // Check if any students are enrolled in this class
    const enrollmentsCount = await EnrollmentModel.countDocuments({
        classId,
        status: {$in: [EnrollmentStatus.APPROVED, EnrollmentStatus.PENDING]},
    });

    appAssert(
        enrollmentsCount === 0,
        CONFLICT,
        `Cannot delete class. ${enrollmentsCount} student${enrollmentsCount > 1 ? "s are" : " is"} enrolled.`
    );

    return ClassModel.deleteOne({_id: classId});
};