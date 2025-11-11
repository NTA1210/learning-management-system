import mongoose from "mongoose";

import {
  UserModel,
  CourseModel,
  EnrollmentModel,
  LessonModel,
  LessonMaterialModel,
  AssignmentModel,
  SubmissionModel,
  QuizModel,
  QuizAttemptModel,
  ForumModel,
  ForumPostModel,
  ForumReplyModel,
  AttendanceModel,
  NotificationModel,
  AnnouncementModel,
  LessonProgressModel,
  MajorModel,
  SessionModel,
  SpecialistModel,
  QuizQuestionModel,
  SubjectModel,
} from "../models";
import {
  EnrollmentStatus,
  EnrollmentMethod,
  EnrollmentRole,
} from "../types/enrollment.type";
import { QuizQuestionType } from "../types/quizQuestion.type";
import { CourseStatus } from "../types/course.type";
import { SubmissionStatus } from "../types/submission.type";
import { MONGO_URI } from "../constants/env";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // Drop whole database if exists
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log("Database dropped");
    }

    // Users (2-3)
    const users = await UserModel.create([
      {
        username: "admin1",
        email: "admin1@example.com",
        password: "123456",
        role: "admin",
        fullname: "Admin One",
        isVerified: true,
      },
      {
        username: "teacher1",
        email: "teacher1@example.com",
        password: "123456",
        role: "teacher",
        fullname: "Teacher One",
        isVerified: true,
      },
      {
        username: "student1",
        email: "student1@example.com",
        password: "123456",
        role: "student",
        fullname: "Student One",
        isVerified: true,
      },
      {
        username: "student2",
        email: "student2@example.com",
        password: "123456",
        role: "student",
        fullname: "Student Two",
        isVerified: true,
      },
    ]);

    // Majors (2)
    const majors = await MajorModel.create([
      { name: "Computer Science", code: "CS" },
      { name: "Design", code: "DS" },
    ]);

    // Specialists (2)
    const specialists = await SpecialistModel.create([
      {
        name: "Frontend",
        description: "Frontend specialist",
        majorId: majors[0]._id,
      },
      { name: "UX", description: "UX specialist", majorId: majors[1]._id },
    ]);

    // Subjects (2)
    const subjects = await SubjectModel.create([
      {
        name: "Introduction to JavaScript",
        description: "Learn JavaScript from scratch",
        code: "JS101",
        slug: "introduction-to-javascript",
        specialistIds: [specialists[0]._id],
        credits: 3,
        isActive: true,
      },
      {
        name: "UI/UX Design Fundamentals",
        description: "Learn UI/UX Design principles",
        code: "UX101",
        slug: "ui-ux-design-fundamentals",
        specialistIds: [specialists[1]._id],
        credits: 4,
        isActive: true,
      },
    ]);

    // Courses (2-3)
    const courses = await CourseModel.create([
      {
        title: "Intro to JavaScript - Fall 2024",
        subjectId: subjects[0]._id,
        description: "Learn JavaScript from scratch",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000), // 90 days
        teacherIds: [users[1]._id],
        isPublished: true,
        capacity: 50,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: false,
        createdBy: users[1]._id,
      },
      {
        title: "UI/UX Design - Fall 2024",
        subjectId: subjects[1]._id,
        description: "Learn UI/UX Design",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000), // 60 days
        teacherIds: [users[1]._id],
        isPublished: true,
        capacity: 30,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: true,
        createdBy: users[1]._id,
      },
    ]);

    // Sessions (2)
    const sessions = await SessionModel.create([
      {
        courseId: courses[0]._id,
        title: "Session 1",
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600 * 1000),
      },
      {
        courseId: courses[1]._id,
        title: "Session A",
        startAt: new Date(),
        endAt: new Date(Date.now() + 7200 * 1000),
      },
    ]);

    // Enrollments (2-3)
    const enrollments = await EnrollmentModel.create([
      {
        studentId: users[2]._id,
        courseId: courses[0]._id,
        status: EnrollmentStatus.APPROVED,
        method: EnrollmentMethod.SELF,
        role: EnrollmentRole.STUDENT,
        respondedBy: users[1]._id,
        respondedAt: new Date(),
        progress: {
          totalLessons: 2,
          completedLessons: 1,
        },
      },
      {
        studentId: users[3]._id,
        courseId: courses[0]._id,
        status: EnrollmentStatus.APPROVED,
        method: EnrollmentMethod.INVITED,
        role: EnrollmentRole.STUDENT,
        respondedBy: users[1]._id,
        respondedAt: new Date(),
        progress: {
          totalLessons: 2,
          completedLessons: 0,
        },
      },
      {
        studentId: users[2]._id,
        courseId: courses[1]._id,
        status: EnrollmentStatus.PENDING,
        method: EnrollmentMethod.SELF,
        role: EnrollmentRole.STUDENT,
        progress: {
          totalLessons: 1,
          completedLessons: 0,
        },
      },
    ]);

    // Lessons (2-3)
    const lessons = await LessonModel.create([
      {
        title: "JS Basics",
        courseId: courses[0]._id,
        content:
          "Learn the basics of JavaScript including variables, data types, and operators",
        order: 1,
        durationMinutes: 30, // 30 minutes
        isPublished: true,
        publishedAt: new Date(),
        createdBy: users[1]._id,
      },
      {
        title: "JS Functions",
        courseId: courses[0]._id,
        content:
          "Understanding JavaScript functions, arrow functions, and callbacks",
        order: 2,
        durationMinutes: 45, // 45 minutes
        isPublished: true,
        publishedAt: new Date(),
        createdBy: users[1]._id,
      },
      {
        title: "UI Principles",
        courseId: courses[1]._id,
        content: "Learn fundamental UI design principles and best practices",
        order: 1,
        durationMinutes: 60, // 60 minutes
        isPublished: true,
        publishedAt: new Date(),
        createdBy: users[1]._id,
      },
    ]);

    // Lesson Materials (2)
    const materials = await LessonMaterialModel.create([
      {
        lessonId: lessons[0]._id,
        title: "JS Basics PDF",
        type: "pdf",
        fileUrl: "/files/js-basics.pdf",
        uploadedBy: users[1]._id,
      },
      {
        lessonId: lessons[2]._id,
        title: "UI Slides",
        type: "ppt",
        fileUrl: "/files/ui-design.ppt",
        uploadedBy: users[1]._id,
      },
    ]);

    // LessonProgress (2-3)
    // Lesson 0: 30 minutes = 1800 seconds, completed (100%) = 1800 seconds spent
    // Lesson 1: 45 minutes = 2700 seconds, 40% progress = 1080 seconds spent
    const progresses = await LessonProgressModel.create([
      {
        lessonId: lessons[0]._id,
        courseId: courses[0]._id,
        studentId: users[2]._id,
        isCompleted: true,
        completedAt: new Date(),
        timeSpentSeconds: 1800, // 30 minutes * 60 = 100% of lesson
        lastAccessedAt: new Date(),
      },
      {
        lessonId: lessons[1]._id,
        courseId: courses[0]._id,
        studentId: users[2]._id,
        isCompleted: false,
        timeSpentSeconds: 1080, // 45 minutes * 60 * 0.4 = 40% of lesson
        lastAccessedAt: new Date(),
      },
    ]);

    // Assignments (2)
    const assignments = await AssignmentModel.create([
      {
        courseId: courses[0]._id,
        title: "JS Exercise 1",
        maxScore: 100,
        createdBy: users[1]._id,
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
      {
        courseId: courses[1]._id,
        title: "Design Project",
        maxScore: 100,
        createdBy: users[1]._id,
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      },
    ]);

    // Submissions (2)
    const submissions = await SubmissionModel.create([
      {
        assignmentId: assignments[0]._id,
        studentId: users[2]._id,
        key: "/submissions/js1.pdf",
        originalName: "js1.pdf",
        mimeType: "application/pdf",
        size: 1024 * 500, // 500KB
        submittedAt: new Date(),
        grade: 8.5,
        feedback: "Great work! Good understanding of JavaScript basics.",
        gradedBy: users[1]._id,
        gradedAt: new Date(),
        isLate: false,
        status: SubmissionStatus.GRADED,
      },
      {
        assignmentId: assignments[1]._id,
        studentId: users[3]._id,
        key: "/submissions/design1.zip",
        originalName: "design1.zip",
        mimeType: "application/zip",
        size: 1024 * 1024 * 2, // 2MB
        submittedAt: new Date(),
        isLate: false,
        status: SubmissionStatus.SUBMITTED,
      },
    ]);

    // Quizzes with nested questions (2)
    const quizzes = await QuizModel.create([
      {
        courseId: courses[0]._id,
        title: "JS Quiz 1",
        questions: [
          {
            text: "What is JS?",
            type: "mcq",
            options: ["Language", "Framework"],
            correct: 0,
          },
          {
            text: "Is JS client-side only?",
            type: "truefalse",
            correct: false,
          },
        ],
      },
      {
        courseId: courses[1]._id,
        title: "Design Quiz",
        questions: [
          { text: "What is UX?", type: "short", correct: "User Experience" },
        ],
      },
    ]);

    // QuizAttempts (2)
    const quizAttempts = await QuizAttemptModel.create([
      {
        quizId: quizzes[0]._id,
        studentId: users[2]._id,
        status: "completed",
        score: 80,
      },
      {
        quizId: quizzes[1]._id,
        studentId: users[3]._id,
        status: "in_progress",
      },
    ]);

    // Forum, Posts, Replies (2 each)
    const forums = await ForumModel.create([
      {
        courseId: courses[0]._id,
        title: "General Discussion",
        createdBy: users[1]._id,
      },
      {
        courseId: courses[1]._id,
        title: "Design Talk",
        createdBy: users[1]._id,
      },
    ]);

    const posts = await ForumPostModel.create([
      {
        forumId: forums[0]._id,
        authorId: users[2]._id,
        content: "Hello everyone!",
      },
      {
        forumId: forums[1]._id,
        authorId: users[3]._id,
        content: "Design tips?",
      },
    ]);

    const replies = await ForumReplyModel.create([
      { postId: posts[0]._id, authorId: users[1]._id, content: "Welcome!" },
      {
        postId: posts[1]._id,
        authorId: users[1]._id,
        content: "Start with user research.",
      },
    ]);

    // Attendance (2)
    const attendance = await AttendanceModel.create([
      {
        courseId: courses[0]._id,
        studentId: users[2]._id,
        date: new Date(),
        status: "present",
        markedBy: users[1]._id,
      },
      {
        courseId: courses[0]._id,
        studentId: users[3]._id,
        date: new Date(),
        status: "absent",
        markedBy: users[1]._id,
      },
    ]);

    // Notifications (2)
    const notifications = await NotificationModel.create([
      {
        title: "Welcome",
        message: "Welcome to LMS!",
        recipientUser: users[2]._id,
      },
      {
        title: "Assignment due",
        message: "Assignment is due soon",
        recipientUser: users[3]._id,
      },
    ]);

    // Announcements (2)
    const announcements = await AnnouncementModel.create([
      {
        title: "New Course",
        content: "Check out our new course",
        courseId: courses[0]._id,
        authorId: users[1]._id,
      },
      {
        title: "Maintenance",
        content: "System maintenance scheduled",
        courseId: null,
        authorId: users[0]._id,
      },
    ]);

    const quizQuestion = await QuizQuestionModel.create({
      subjectId: subjects[0]._id,
      text: "What is JS?",
      type: QuizQuestionType.MCQ,
      options: ["Language", "Framework"],
      correctOptions: [0],
      points: 1,
      explanation: "JavaScript is a programming language, not a framework.",
    });

    console.log("Seeding finished");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
