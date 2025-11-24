import mongoose from 'mongoose';
import { IAttendance } from '../types';
import { AttendanceStatus } from '../types/attendance.type';

const AttendanceSchema = new mongoose.Schema<IAttendance>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
  { timestamps: true }
);

AttendanceSchema.index({ courseId: 1, studentId: 1, date: 1 }, { unique: true });
const AttendanceModel = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default AttendanceModel;
