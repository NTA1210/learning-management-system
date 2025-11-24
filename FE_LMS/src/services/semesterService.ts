import http from "../utils/http";

export interface Semester {
  _id: string;
  name: string;
  type: "fall" | "spring" | "summer";
  year: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export const semesterService = {
  getAllSemesters: async (): Promise<Semester[]> => {
    const response = await http.get<Semester[]>("/semesters");
    return Array.isArray(response.data) ? response.data : [];
  },
};

