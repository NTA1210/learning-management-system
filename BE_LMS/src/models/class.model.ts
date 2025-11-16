import mongoose from "mongoose";
import IClass, {ClassStatus} from "../types/class.type";

const ClassSchema = new mongoose.Schema<IClass>({
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        className: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100,
        },
        teacherIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        capacity: {
            type: Number,
            required: true,
            min: 1,
            max: 200,
        },
        currentEnrollment: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(ClassStatus),
            default: ClassStatus.DRAFT,
            required: true,
        },
        semester: {
            type: String,
            trim: true,
        },
        academicYear: {
            type: String,
            trim: true,
        },
        classroom: {
            type: String,
            trim: true,
        },
        meta: {
            type: mongoose.Schema.Types.Mixed,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
ClassSchema.index({courseId: 1, status: 1});
ClassSchema.index({teacherIds: 1, status: 1});
ClassSchema.index({semester: 1, academicYear: 1});
ClassSchema.index({courseId: 1, className: 1}, {unique: true}); // Unique class name per course

// Compound index for finding classes by course and status
ClassSchema.index({courseId: 1, status: 1, createdAt: -1});

// Validation: Ensure currentEnrollment doesn't exceed capacity
ClassSchema.pre("save", function (next) {
    if (this.currentEnrollment > this.capacity) {
        return next(
            new Error("Current enrollment cannot exceed class capacity")
        );
    }
    next();
});

const ClassModel = mongoose.model<IClass>("Class", ClassSchema, "classes");

export default ClassModel;

