import ClassModel from "../models/class.model";
import EnrollmentModel from "../models/enrollment.model";
import {ClassStatus} from "../types/class.type";
import {EnrollmentStatus} from "../types/enrollment.type";
import appAssert from "../utils/appAssert";
import {CONFLICT, NOT_FOUND} from "../constants/http";
import {ACTUAL_MAX_CLASS_LIMIT, RECOMMENDED_CLASS_LIMIT} from "@/constants/fieldLimits";
import AppError from "@/utils/AppError";
import AppErrorCode from "@/constants/appErrorCode";
import {CreateClassInput, UpdateClassInput} from "@/validators/class.schemas";
import {CourseModel, UserModel} from "@/models";
import mongoose from "mongoose";

export const createEmptyClasses = async (courseId: string, userId: mongoose.Types.ObjectId, totalStudents?: number) => {
    // Fetch all approved enrollments for this course if total students is not provided.
    // Sort by createdAt to maintain FIFO order (first enrolled, first assigned)
    if (!totalStudents) {
        const approvedEnrollments = await EnrollmentModel.find({
            courseId,
            status: EnrollmentStatus.APPROVED,
        })
            .select("_id studentId courseId")
            .sort({createdAt: 1})
            .lean()
            .exec();
        totalStudents = approvedEnrollments.length;
    }

    // Get subject code for class name generation
    const course = await CourseModel.findById(courseId).populate("subjectId", "code").lean();
    const subjectCode = (course as any)?.subjectId?.code;

    // Check if class name already exists for this course
    const existingClass = await ClassModel.countDocuments({
        courseId,
        className: {$regex: `^${subjectCode}_\\d+$`},
    });

    appAssert(
        !existingClass,
        CONFLICT,
        "Class with this name already exists for the course"
    );

    // Handle edge case: no students to distribute
    if (totalStudents === 0) {
        // Create single empty class
        return await ClassModel.create({
            courseId,
            className: `${subjectCode}_${existingClass + 1}`,
            capacity: ACTUAL_MAX_CLASS_LIMIT,
            status: ClassStatus.DRAFT,
            currentEnrollment: 0,
            createdBy: userId,
        });
    }

    // Calculate optimal class distribution
    const classDistribution = distributeStudentsEvenly(totalStudents);

    // Validate distribution matches student count
    const totalCapacity = classDistribution.reduce((sum, cap) => sum + cap, 0);
    appAssert(
        totalCapacity === totalStudents,
        500,
        `Class distribution error: capacity ${totalCapacity} doesn't match ${totalStudents} students`
    );

    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Build and create classes based on distribution
        const classesToCreate: Partial<CreateClassInput>[] = [];
        for (let i = 0; i < classDistribution.length; i++) {
            classesToCreate.push({
                courseId,
                className: `${subjectCode}_${existingClass + 1}`,
                capacity: classDistribution[i],
                status: ClassStatus.DRAFT,
                currentEnrollment: 0,
                createdBy: userId,
            });
        }

        // Insert all classes in bulk
        const classes = await ClassModel.insertMany(classesToCreate, {
            session,
            ordered: true, // Stop on first error
        });
        await session.commitTransaction();
        return classes;
    } catch (error) {
        // Rollback on error
        await session.abortTransaction();

        // Re-throw with more context
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            `Failed to create classes and distribute students: ${(error as Error).message}`,
            500,
            AppErrorCode.ValidationError
        );
    } finally {
        await session.endSession();
    }
}

/**
 * Creates empty classes and distributes students into them based on optimal class size.
 * @deprecated Use `createEmptyClasses` + `assignStudentsIntoClasses` instead for better separation of concerns.
 * */
export const createClasses = async (input: CreateClassInput) => {
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

    // Fetch all approved enrollments for this course
    // Sort by createdAt to maintain FIFO order (first enrolled, first assigned)
    const approvedEnrollments = await EnrollmentModel.find({
        courseId: input.courseId,
        status: EnrollmentStatus.APPROVED,
    })
    .select("_id studentId courseId")
    .sort({createdAt: 1})
    .lean()
    .exec();

    const totalStudents = approvedEnrollments.length;

    // Handle edge case: no students to distribute
    if (totalStudents === 0) {
        // Create single empty class
        const emptyClass = await ClassModel.create({
            ...input,
            capacity: ACTUAL_MAX_CLASS_LIMIT,
            status: ClassStatus.DRAFT,
            currentEnrollment: 0,
        });
        return [emptyClass];
    }

    // Calculate optimal class distribution
    const classDistribution = distributeStudentsEvenly(totalStudents);

    // Validate distribution matches student count
    const totalCapacity = classDistribution.reduce((sum, cap) => sum + cap, 0);
    appAssert(
        totalCapacity === totalStudents,
        500,
        `Class distribution error: capacity ${totalCapacity} doesn't match ${totalStudents} students`
    );

    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Build and create classes based on distribution
        const classesToCreate: Partial<CreateClassInput>[] = [];
        for (let i = 0; i < classDistribution.length; i++) {
            classesToCreate.push({
                ...input,
                className: `${input.className} - Section ${i + 1}`,
                capacity: classDistribution[i],
                status: ClassStatus.DRAFT,
                currentEnrollment: classDistribution[i],
            });
        }

        // Insert all classes in bulk for better performance
        const createdClasses = await ClassModel.insertMany(classesToCreate, {
            session,
            ordered: true, // Stop on first error
        });

        // Distribute students across classes using bulk operations
        let studentIndex = 0;
        const bulkEnrollmentOps: any[] = [];
        const bulkUserOps: any[] = [];

        for (let classIdx = 0; classIdx < createdClasses.length; classIdx++) {
            const currentClass = createdClasses[classIdx];
            const studentsForThisClass = classDistribution[classIdx];
            let assignedCount = 0;

            // Assign students to this class
            for (let i = 0; i < studentsForThisClass && studentIndex < totalStudents; i++) {
                const enrollment = approvedEnrollments[studentIndex];

                // Validate enrollment data
                if (!enrollment._id || !enrollment.studentId) {
                    studentIndex++;
                    continue;
                }

                // Update enrollment with classId
                bulkEnrollmentOps.push({
                    updateOne: {
                        filter: {_id: enrollment._id},
                        update: {$set: {classId: currentClass._id}},
                    },
                });

                // Update user's classIds array (add to set to avoid duplicates)
                bulkUserOps.push({
                    updateOne: {
                        filter: {_id: enrollment.studentId},
                        update: {$addToSet: {classIds: currentClass._id}},
                    },
                });

                studentIndex++;
                assignedCount++;
            }
        }

        // Verify all students were assigned
        appAssert(studentIndex === totalStudents, 500, "Not all students were assigned to classes");

        // Execute bulk operations with ordered: false for better parallelization
        if (bulkEnrollmentOps.length > 0) {
            const enrollmentResult = await EnrollmentModel.bulkWrite(bulkEnrollmentOps, {
                session,
                ordered: false, // Continue on error, collect all results
            });

            // Check for any failed updates
            if (enrollmentResult.modifiedCount !== bulkEnrollmentOps.length) {
                console.warn(`Expected ${bulkEnrollmentOps.length} updates, got ${enrollmentResult.modifiedCount}`);
            }
        }

        if (bulkUserOps.length > 0) {
            const userResult = await UserModel.bulkWrite(bulkUserOps, {
                session,
                ordered: false,
            });
        }

        // Commit transaction
        await session.commitTransaction();
        return createdClasses;
    } catch (error) {
        // Rollback on error
        await session.abortTransaction();

        // Re-throw with more context
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            `Failed to create classes and distribute students: ${(error as Error).message}`,
            500,
            AppErrorCode.ValidationError
        );
    } finally {
        await session.endSession();
    }
};

export const assignStudentsIntoClasses = async (classIds: string[], courseId: string) => {
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Fetch all classes from a list of class IDs
        const classes = await ClassModel.find({
            _id: {$in: classIds},
        }).session(session);

        // Fetch all approved enrollments for these classes' course
        const totalStudents = classes.reduce((sum, cls) => sum + cls.capacity, 0);

        // Distribute students across classes using bulk operations
        let studentIndex = 0;
        const bulkEnrollmentOps: any[] = [];
        const bulkUserOps: any[] = [];

        // Sort by createdAt to maintain FIFO order (first enrolled, first assigned)
        const approvedEnrollments = await EnrollmentModel.find({
            courseId,
            status: EnrollmentStatus.APPROVED,
        })
            .select("_id studentId courseId")
            .sort({createdAt: 1})
            .lean()
            .exec();

        for (let classIdx = 0; classIdx < classes.length; classIdx++) {
            const currentClass = classes[classIdx];
            const studentsForThisClass = classes[classIdx].capacity;
            let assignedCount = 0;

            // Assign students to this class
            for (let i = 0; i < studentsForThisClass && studentIndex < totalStudents; i++) {
                const enrollment = approvedEnrollments[studentIndex];

                // Validate enrollment data
                if (!enrollment._id || !enrollment.studentId) {
                    studentIndex++;
                    continue;
                }

                // Update enrollment with classId
                bulkEnrollmentOps.push({
                    updateOne: {
                        filter: {_id: enrollment._id},
                        update: {$set: {classId: currentClass._id}},
                    },
                });

                // Update user's classIds array (add to set to avoid duplicates)
                bulkUserOps.push({
                    updateOne: {
                        filter: {_id: enrollment.studentId},
                        update: {$addToSet: {classIds: currentClass._id}},
                    },
                });

                studentIndex++;
                assignedCount++;
            }
        }

        // Verify all students were assigned
        appAssert(studentIndex === totalStudents, 500, "Not all students were assigned to classes");

        // Execute bulk operations with ordered: false for better parallelization
        if (bulkEnrollmentOps.length > 0) {
            const enrollmentResult = await EnrollmentModel.bulkWrite(bulkEnrollmentOps, {
                session,
                ordered: false, // Continue on error, collect all results
            });

            // Check for any failed updates
            if (enrollmentResult.modifiedCount !== bulkEnrollmentOps.length) {
                console.warn(`Expected ${bulkEnrollmentOps.length} updates, got ${enrollmentResult.modifiedCount}`);
            }
        }

        if (bulkUserOps.length > 0) {
            await UserModel.bulkWrite(bulkUserOps, {
                session,
                ordered: false,
            });
        }

        // Commit transaction
        await session.commitTransaction();
        return classes;
    } catch (error) {
        // Rollback on error
        await session.abortTransaction();

        // Re-throw with more context
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            `Failed to create classes and distribute students: ${(error as Error).message}`,
            500,
            AppErrorCode.ValidationError
        );
    } finally {
        await session.endSession();
    }
}

/**
 * Helper function to distribute students evenly into classes based on a recommended class limit.
 * Uses intelligent distribution to balance class sizes while respecting limits.
 *
 * IMPROVEMENTS:
 * - Configurable minimum class size threshold to avoid very small classes
 * - Better handling of edge cases (0, 1, very large numbers)
 * - Smart rebalancing when classes would be too uneven
 * - Preference for fewer, fuller classes over many small classes
 *
 * @param totalStudents Total number of students to be distributed.
 * @returns An array representing the number of students in each class. Length of array is the number of classes.
 * @throws AppError if `totalStudents` is invalid or limits are misconfigured.
 */
function distributeStudentsEvenly(totalStudents: number): number[] {
    // Input validation
    if (!Number.isInteger(totalStudents) || totalStudents < 0) {
        throw new AppError(
            `Invalid totalStudents: ${totalStudents}. Must be a non-negative integer.`,
            400,
            AppErrorCode.ValidationError
        );
    }

    if (totalStudents === 0) {
        console.log("No students to distribute - returning empty distribution");
        return [];
    }

    // Configuration validation
    if (RECOMMENDED_CLASS_LIMIT <= 0) {
        throw new AppError(
            `Invalid RECOMMENDED_CLASS_LIMIT: ${RECOMMENDED_CLASS_LIMIT}. Must be positive.`,
            500,
            AppErrorCode.ValidationError
        );
    }

    if (ACTUAL_MAX_CLASS_LIMIT < RECOMMENDED_CLASS_LIMIT) {
        throw new AppError(
            `ACTUAL_MAX_CLASS_LIMIT (${ACTUAL_MAX_CLASS_LIMIT}) must be >= RECOMMENDED_CLASS_LIMIT (${RECOMMENDED_CLASS_LIMIT})`,
            500,
            AppErrorCode.ValidationError
        );
    }


    // Configuration: Minimum acceptable class size (configurable threshold)
    // Set to 40% of recommended limit to avoid very small classes
    const MIN_CLASS_SIZE_THRESHOLD = Math.max(10, Math.floor(RECOMMENDED_CLASS_LIMIT * 0.4));

    // Edge case: Very small number of students - single class
    if (totalStudents <= RECOMMENDED_CLASS_LIMIT) {
        return [totalStudents];
    }

    // Calculate initial distribution
    const baseNumberOfClasses = Math.floor(totalStudents / RECOMMENDED_CLASS_LIMIT);
    const leftOverStudents = totalStudents % RECOMMENDED_CLASS_LIMIT;

    let numberOfClasses: number;
    let classDistribution: number[];

    // STRATEGY: Intelligent distribution to avoid edge cases
    // 1. Perfect distribution - no leftover
    // 2. Small leftover - merge into existing classes
    // 3. Large leftover - create new class and rebalance
    // 4. Always ensure no class is too small or too large

    if (leftOverStudents === 0) {
        // Perfect distribution - all classes have exactly RECOMMENDED_CLASS_LIMIT
        numberOfClasses = baseNumberOfClasses;
        classDistribution = new Array(numberOfClasses).fill(RECOMMENDED_CLASS_LIMIT);

    } else if (leftOverStudents < MIN_CLASS_SIZE_THRESHOLD) {
        // Small leftover - distribute across existing classes to avoid tiny last class
        // This keeps class count lower while staying under max limit
        numberOfClasses = baseNumberOfClasses;
        classDistribution = new Array(numberOfClasses).fill(RECOMMENDED_CLASS_LIMIT);

        // Round-robin distribution of leftover students
        for (let i = 0; i < leftOverStudents; i++) {
            classDistribution[i % numberOfClasses] += 1;
        }
    } else {
        // Large leftover - create new class and rebalance for even distribution
        // This prevents having one very small class at the end
        numberOfClasses = baseNumberOfClasses + 1;
        const avgPerClass = Math.floor(totalStudents / numberOfClasses);
        const remainder = totalStudents % numberOfClasses;

        classDistribution = new Array(numberOfClasses).fill(avgPerClass);

        // Distribute remainder evenly across first N classes
        for (let i = 0; i < remainder; i++) {
            classDistribution[i] += 1;
        }
    }

    // SAFETY CHECK 1: Ensure no class exceeds ACTUAL_MAX_CLASS_LIMIT
    const maxClassSize = Math.max(...classDistribution);
    if (maxClassSize > ACTUAL_MAX_CLASS_LIMIT) {
        // Force recalculation based on hard max limit
        numberOfClasses = Math.ceil(totalStudents / ACTUAL_MAX_CLASS_LIMIT);
        const avgPerClass = Math.floor(totalStudents / numberOfClasses);
        const remainder = totalStudents % numberOfClasses;

        classDistribution = new Array(numberOfClasses).fill(avgPerClass);

        // Distribute remainder to avoid clustering
        for (let i = 0; i < remainder; i++) {
            classDistribution[i] += 1;
        }
    }

    // SAFETY CHECK 2: Verify no class is below minimum threshold (except for very small total)
    const minClassSize = Math.min(...classDistribution);
    if (minClassSize < MIN_CLASS_SIZE_THRESHOLD && totalStudents > MIN_CLASS_SIZE_THRESHOLD) {
        // Attempt to merge small classes by reducing class count
        if (numberOfClasses > 1) {
            const newNumberOfClasses = numberOfClasses - 1;
            const newAvgPerClass = Math.floor(totalStudents / newNumberOfClasses);
            const newRemainder = totalStudents % newNumberOfClasses;

            // Check if this would exceed max limit
            if (newAvgPerClass + 1 <= ACTUAL_MAX_CLASS_LIMIT) {
                numberOfClasses = newNumberOfClasses;
                classDistribution = new Array(numberOfClasses).fill(newAvgPerClass);

                for (let i = 0; i < newRemainder; i++) {
                    classDistribution[i] += 1;
                }
            }
        }
    }

    // FINAL VALIDATION: Ensure distribution integrity
    const totalDistributed = classDistribution.reduce((sum, count) => sum + count, 0);
    if (totalDistributed !== totalStudents) {
        throw new AppError(
            `Distribution error: ${totalDistributed} students distributed instead of ${totalStudents}`,
            500,
            AppErrorCode.ValidationError
        );
    }

    // Verify all classes are within bounds
    const finalMax = Math.max(...classDistribution);
    const finalMin = Math.min(...classDistribution);

    if (finalMax > ACTUAL_MAX_CLASS_LIMIT) {
        throw new AppError(
            `Distribution error: Class size ${finalMax} exceeds ACTUAL_MAX_CLASS_LIMIT ${ACTUAL_MAX_CLASS_LIMIT}`,
            500,
            AppErrorCode.ValidationError
        );
    }

    // Calculate variance to show distribution quality
    const avg = totalStudents / classDistribution.length;
    const variance = classDistribution.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0) / classDistribution.length;

    return classDistribution;
}

export const getClassesByCourse = async (courseId: string, status?: string) => {
    const filter: any = {courseId};
    if (status) {
        filter.status = status;
    }

    return await ClassModel.find(filter)
        .populate("teacherId", "fullname email avatar_url")
        .populate("courseId", "title description")
        .sort({createdAt: -1})
        .lean();
};

export const getClassById = async (classId: string) => {
    const classData = await ClassModel.findById(classId)
        .populate("teacherId", "fullname email avatar_url")
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

export const updateClassById = async (classId: string, updates: UpdateClassInput) => {
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

    // If updating teacher ID, check if this user has teacher role
    if (updates.teacherId && updates.teacherId !== classData.teacherId?.toString()) {
        const teacher = await UserModel.findById(updates.teacherId);
        appAssert(teacher && teacher.role === "teacher", CONFLICT, "Assigned teacherId does not belong to a valid teacher");
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

    return await ClassModel.find(filter)
        .populate("courseId", "title description")
        .sort({semester: -1, createdAt: -1})
        .lean();
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