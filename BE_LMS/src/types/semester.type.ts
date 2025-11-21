import mongoose from "mongoose";

export enum SemesterType {
  SUMMER = "summer",
  FALL = "fall",
  SPRING = "spring",
}

export default interface ISemester extends mongoose.Document {
  name?: string;
  year?: number;
  type: SemesterType;
  startDate: Date;
  endDate: Date;
}
