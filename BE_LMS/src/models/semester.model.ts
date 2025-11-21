import ISemester, { SemesterType } from "@/types/semester.type";
import mongoose from "mongoose";

const SemesterSchema = new mongoose.Schema<ISemester>(
  {
    name: { type: String },
    year: { type: Number },
    type: {
      type: String,
      enum: SemesterType,
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

//indexes
SemesterSchema.index({ name: 1 });
SemesterSchema.index({ year: 1 });
SemesterSchema.index({ type: 1 });
SemesterSchema.index({ startDate: 1 });
SemesterSchema.index({ endDate: 1 });

//hooks
SemesterSchema.pre("save", function (next) {
  this.name = this.type.toUpperCase() + " " + this.year; // name = type + year = "SUMMER 2023"
  next();
});

const SemesterModel = mongoose.model<ISemester>(
  "Semester",
  SemesterSchema,
  "semesters"
);
export default SemesterModel;
