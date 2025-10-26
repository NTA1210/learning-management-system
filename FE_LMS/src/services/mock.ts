// Mock data for dashboard statistics
export const userStats = {
    totalUsers: 1247,
    activeUsers: 892,
    avgSessionMin: 45,
    expiredSessions: 23
  };
  
  export const distributionSummary = {
    totalStudents: 1247,
    uniqueBatches: 12,
    activeCampuses: 3,
    activeClasses: 45,
    uniqueMajors: 8
  };
  
  // Mock data for charts
  export const studentsByBatchData = [
    { batch: '2020', students: 156 },
    { batch: '2021', students: 234 },
    { batch: '2022', students: 298 },
    { batch: '2023', students: 312 },
    { batch: '2024', students: 247 }
  ];
  
  export const studentsByCampusData = [
    { campus: 'Hanoi', students: 456 },
    { campus: 'Ho Chi Minh', students: 523 },
    { campus: 'Da Nang', students: 268 }
  ];
  
  export const studentsPerClassData = [
    { className: 'SE1501', students: 32 },
    { className: 'SE1502', students: 28 },
    { className: 'SE1503', students: 35 },
    { className: 'SE1504', students: 30 },
    { className: 'SE1505', students: 33 }
  ];
  
  export const studentsByMajorData = [
    { major: 'Software Engineering', students: 456 },
    { major: 'Information Technology', students: 234 },
    { major: 'Computer Science', students: 198 },
    { major: 'Data Science', students: 156 },
    { major: 'Cybersecurity', students: 123 },
    { major: 'AI/ML', students: 80 }
  ];

  // Student Dashboard Mock Data
  export const studentStats = {
    enrolledCourses: 5,
    pendingAssignments: 8,
    upcomingQuizzes: 3
  };

  export const myCourses = [
    {
      id: 1,
      name: 'Java Programming',
      instructor: 'Dr. Smith',
      progress: 75,
      icon: '☕',
      color: '#6366f1'
    },
    {
      id: 2,
      name: 'Database Systems',
      instructor: 'Prof. Johnson',
      progress: 60,
      icon: '💾',
      color: '#8b5cf6'
    },
    {
      id: 3,
      name: 'Web Development',
      instructor: 'Dr. Williams',
      progress: 90,
      icon: '🌐',
      color: '#06b6d4'
    }
  ];

  export const recentAssignments = [
    {
      id: 1,
      title: 'Assignment 3: OOP Design',
      course: 'Java Programming',
      dueDate: '2024-01-20',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Lab Exercise 5',
      course: 'Database Systems',
      dueDate: '2024-01-22',
      status: 'submitted'
    },
    {
      id: 3,
      title: 'Project Proposal',
      course: 'Web Development',
      dueDate: '2024-01-25',
      status: 'pending'
    }
  ];

  export const upcomingQuizzes = [
    {
      id: 1,
      title: 'Quiz 2: SQL Basics',
      course: 'Database Systems',
      date: '2024-01-18',
      duration: '30 min'
    },
    {
      id: 2,
      title: 'Midterm Quiz',
      course: 'Java Programming',
      date: '2024-01-20',
      duration: '60 min'
    },
    {
      id: 3,
      title: 'Final Assessment',
      course: 'Web Development',
      date: '2024-01-28',
      duration: '90 min'
    }
  ];

  export const attendanceData = [
    {
      course: 'Java Programming',
      present: 18,
      total: 20,
      percentage: 90
    },
    {
      course: 'Database Systems',
      present: 16,
      total: 20,
      percentage: 80
    },
    {
      course: 'Web Development',
      present: 19,
      total: 20,
      percentage: 95
    }
  ];

  export const gradeSummary = {
    averageGrade: 85
  };

  // Available courses for enrollment
  export const availableCourses = [
    {
      id: 4,
      name: 'Mobile App Development',
      instructor: 'Prof. Lee',
      description: 'Learn to build cross-platform mobile applications',
      capacity: 50,
      enrolled: 35,
      icon: '📱',
      color: '#ec4899'
    },
    {
      id: 5,
      name: 'Cloud Computing',
      instructor: 'Dr. Chen',
      description: 'Introduction to cloud services and infrastructure',
      capacity: 40,
      enrolled: 28,
      icon: '☁️',
      color: '#06b6d4'
    },
    {
      id: 6,
      name: 'Machine Learning Basics',
      instructor: 'Prof. Kumar',
      description: 'Fundamentals of ML algorithms and applications',
      capacity: 45,
      enrolled: 42,
      icon: '🤖',
      color: '#8b5cf6'
    }
  ];

  // Lesson materials
  export const lessonMaterials = [
    {
      id: 1,
      course: 'Java Programming',
      title: 'Introduction to OOP',
      type: 'video',
      duration: '45:30',
      completed: true
    },
    {
      id: 2,
      course: 'Java Programming',
      title: 'Polymorphism and Inheritance',
      type: 'video',
      duration: '52:15',
      completed: true
    },
    {
      id: 3,
      course: 'Database Systems',
      title: 'SQL Query Guide',
      type: 'pdf',
      pages: 24,
      completed: true
    },
    {
      id: 4,
      course: 'Web Development',
      title: 'React Hooks Tutorial',
      type: 'video',
      duration: '38:20',
      completed: false
    }
  ];
  