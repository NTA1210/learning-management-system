import mongoose from "mongoose";
import dotenv from "dotenv";

import {
  UserModel,
  CategoryModel,
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
} from "../models";
import { EnrollmentStatus } from "../types/enrollment.type";
import { QuizQuestionType } from "@/types/quizQuestion.type";

dotenv.config();

async function seed() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/lms");
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
        verified: true,
      },
      {
        username: "teacher1",
        email: "teacher1@example.com",
        password: "123456",
        role: "teacher",
        fullname: "Teacher One",
        verified: true,
      },
      {
        username: "student1",
        email: "student1@example.com",
        password: "123456",
        role: "student",
        fullname: "Student One",
        verified: true,
      },
      {
        username: "student2",
        email: "student2@example.com",
        password: "123456",
        role: "student",
        fullname: "Student Two",
        verified: true,
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

    // Courses (2-3)
    const courses = await CourseModel.create([
      {
        title: "Intro to JavaScript",
        code: "JS101",
        description: "Learn JavaScript from scratch",
        startDate: new Date(),
        specialistIds: [specialists[0]._id],
        endDate: new Date(Date.now() + 3600 * 1000),
        major: majors[0]._id,
        teachers: [users[1]._id],
        isPublished: true,
        capacity: 50,
      },
      {
        title: "UI/UX Design",
        code: "UX101",
        description: "Learn UI/UX Design",
        startDate: new Date(),
        specialistIds: [specialists[1]._id],
        endDate: new Date(Date.now() + 3600 * 1000),
        major: majors[1]._id,
        teachers: [users[1]._id],
        isPublished: true,
        capacity: 30,
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
      },
      {
        studentId: users[3]._id,
        courseId: courses[0]._id,
        status: EnrollmentStatus.APPROVED,
      },
      {
        studentId: users[2]._id,
        courseId: courses[1]._id,
        status: EnrollmentStatus.APPROVED,
      },
    ]);

    // Lessons (2-3)
    const lessons = await LessonModel.create([
      {
        title: "JS Basics",
        courseId: courses[0]._id,
        content: "Basics",
        order: 1,
        durationMinutes: 30,
        publishedAt: new Date(),
      },
      {
        title: "JS Functions",
        courseId: courses[0]._id,
        content: "Functions",
        order: 2,
        durationMinutes: 45,
        publishedAt: new Date(),
      },
      {
        title: "UI Principles",
        courseId: courses[1]._id,
        content: "UI",
        order: 1,
        durationMinutes: 60,
        publishedAt: new Date(),
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
    const progresses = await LessonProgressModel.create([
      {
        lessonId: lessons[0]._id,
        courseId: courses[0]._id,
        studentId: users[2]._id,
        completed: true,
        progressPercent: 100,
      },
      {
        lessonId: lessons[1]._id,
        courseId: courses[0]._id,
        studentId: users[2]._id,
        completed: false,
        progressPercent: 40,
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
        submittedAt: new Date(),
        score: 85,
      },
      {
        assignmentId: assignments[1]._id,
        studentId: users[3]._id,
        key: "/submissions/design1.zip",
        originalName: "design1.zip",
        submittedAt: new Date(),
        score: null,
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
      courseId: courses[0]._id,
      specialistId: users[1]._id,
      text: "What is JS?",
      type: QuizQuestionType.MCQ,
      options: ["Language", "Framework"],
      correctOptions: [1, 0],
    });

    console.log("Seeding finished");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
