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

export interface SemesterStatistics {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  totalEnrollments: number;
}

export const semesterService = {
  getAllSemesters: async (): Promise<Semester[]> => {
    const response = await http.get<Semester[] | { data: Semester[] }>("/semesters");
    // Handle both response formats (array or wrapped in data)
    if (Array.isArray(response)) {
      return response;
    }
    return Array.isArray((response as { data: Semester[] }).data) 
      ? (response as { data: Semester[] }).data 
      : [];
  },

  /**
   * Get the current active semester based on today's date
   * Returns the semester where today falls between startDate and endDate
   */
  getCurrentSemester: async (): Promise<Semester | null> => {
    const semesters = await semesterService.getAllSemesters();
    const today = new Date();
    
    // Find semester where today is between startDate and endDate
    const currentSemester = semesters.find((semester) => {
      const startDate = new Date(semester.startDate);
      const endDate = new Date(semester.endDate);
      return today >= startDate && today <= endDate;
    });
    
    return currentSemester || null;
  },

  /**
   * Get semester statistics (Admin/Teacher only)
   * GET /semesters/:semesterId/statistics
   */
  getSemesterStatistics: async (semesterId: string): Promise<SemesterStatistics> => {
    const response = await http.get<{ data: SemesterStatistics }>(
      `/semesters/${semesterId}/statistics`
    );
    return response.data as unknown as SemesterStatistics;
  },

  /**
   * Create a new semester (Admin only)
   * POST /semesters
   */
  createSemester: async (data: Omit<Semester, '_id' | 'createdAt' | 'updatedAt'>): Promise<Semester> => {
    const response = await http.post<{ data: Semester }>("/semesters", data);
    return response.data as unknown as Semester;
  },

  /**
   * Update a semester (Admin only)
   * PUT /semesters/:semesterId
   */
  updateSemester: async (
    semesterId: string, 
    data: Partial<Omit<Semester, '_id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Semester> => {
    const response = await http.put<{ data: Semester }>(`/semesters/${semesterId}`, data);
    return response.data as unknown as Semester;
  },

  /**
   * Delete a semester (Admin only)
   * DELETE /semesters/:semesterId
   */
  deleteSemester: async (semesterId: string): Promise<{ message: string }> => {
    const response = await http.del<{ message: string }>(`/semesters/${semesterId}`);
    return response as unknown as { message: string };
  },
};

