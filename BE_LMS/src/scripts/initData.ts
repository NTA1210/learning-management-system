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
import { ForumType } from "../types/forum.type";
import { NotificationType } from "../types/notification.type";
import { AttendanceStatus } from "../types/attendance.type";
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
        note: "Essential JavaScript concepts and syntax",
        originalName: "js-basics.pdf",
        mimeType: "application/pdf",
        key: `courses/${courses[0]._id}/lessons/${lessons[0]._id}/js-basics.pdf`,
        size: 1024 * 512, // 512KB
        uploadedBy: users[1]._id,
      },
      {
        lessonId: lessons[2]._id,
        title: "UI Design Slides",
        note: "UI principles and best practices",
        originalName: "ui-design.pptx",
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        key: `courses/${courses[1]._id}/lessons/${lessons[2]._id}/ui-design.pptx`,
        size: 1024 * 1024 * 3, // 3MB
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
        description: "Complete exercises on variables, functions, and control structures",
        maxScore: 100,
        createdBy: users[1]._id,
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        allowLate: true,
      },
      {
        courseId: courses[1]._id,
        title: "Design Project",
        description: "Create a wireframe and mockup for a mobile app",
        maxScore: 100,
        createdBy: users[1]._id,
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        allowLate: false,
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

    // Quiz Questions (3-4)
    const quizQuestions = await QuizQuestionModel.create([
      {
        subjectId: subjects[0]._id,
        text: "What is JS?",
        type: QuizQuestionType.MCQ,
        options: ["Language", "Framework", "Library", "Tool"],
        correctOptions: [0],
        points: 1,
        explanation: "JavaScript is a programming language.",
      },
      {
        subjectId: subjects[0]._id,
        text: "Is JS client-side only?",
        type: QuizQuestionType.TRUE_FALSE,
        options: ["True", "False"],
        correctOptions: [1],
        points: 1,
        explanation: "JavaScript can run on both client-side (browser) and server-side (Node.js).",
      },
      {
        subjectId: subjects[1]._id,
        text: "What does UX stand for?",
        type: QuizQuestionType.FILL_BLANK,
        options: ["User Experience", "User eXperience", "UX"],
        correctOptions: [1, 1, 0], // First two are correct, third is wrong
        points: 2,
        explanation: "UX stands for User Experience.",
      },
    ]);

    // Quizzes (2)
    const quizzes = await QuizModel.create([
      {
        courseId: courses[0]._id,
        title: "JS Quiz 1",
        description: "Test your JavaScript knowledge",
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
        shuffleQuestions: true,
        questionIds: [quizQuestions[0]._id, quizQuestions[1]._id],
        isPublished: true,
        isCompleted: false,
        createdBy: users[1]._id,
      },
      {
        courseId: courses[1]._id,
        title: "Design Quiz",
        description: "UX/UI Design basics",
        startTime: new Date(),
        endTime: new Date(Date.now() + 10 * 24 * 3600 * 1000), // 10 days
        shuffleQuestions: false,
        questionIds: [quizQuestions[2]._id],
        isPublished: true,
        isCompleted: false,
        createdBy: users[1]._id,
      },
    ]);

    // QuizAttempts (2)
    const quizAttempts = await QuizAttemptModel.create([
      {
        quizId: quizzes[0]._id,
        studentId: users[2]._id,
        startedAt: new Date(),
        submittedAt: new Date(),
        durationSeconds: 600, // 10 minutes
        score: 80,
        status: "completed",
        answers: [
          {
            questionId: quizQuestions[0]._id,
            answer: [0],
            correct: true,
            pointsEarned: 1,
          },
          {
            questionId: quizQuestions[1]._id,
            answer: [1],
            correct: true,
            pointsEarned: 1,
          },
        ],
      },
      {
        quizId: quizzes[1]._id,
        studentId: users[3]._id,
        startedAt: new Date(),
        status: "in_progress",
        answers: [],
      },
    ]);

    // Forum, Posts, Replies (2 each)
    const forums = await ForumModel.create([
      {
        courseId: courses[0]._id,
        title: "General Discussion",
        description: "A place to discuss JavaScript topics",
        forumType: ForumType.DISCUSSION,
        isActive: true,
        isArchived: false,
        createdBy: users[1]._id,
      },
      {
        courseId: courses[1]._id,
        title: "Course Announcements",
        description: "Important updates about the course",
        forumType: ForumType.ANNOUNCEMENT,
        isActive: true,
        isArchived: false,
        createdBy: users[1]._id,
      },
    ]);

    const posts = await ForumPostModel.create([
      {
        forumId: forums[0]._id,
        authorId: users[2]._id,
        title: "Welcome Post",
        content: "Hello everyone! Excited to learn JavaScript together.",
        pinned: true,
        replyCount: 1,
      },
      {
        forumId: forums[1]._id,
        authorId: users[1]._id,
        title: "Design Assignment Tips",
        content: "Here are some helpful tips for the upcoming design assignment.",
        pinned: false,
        replyCount: 1,
      },
    ]);

    const replies = await ForumReplyModel.create([
      {
        postId: posts[0]._id,
        authorId: users[1]._id,
        content: "Welcome! Great to have you here.",
      },
      {
        postId: posts[1]._id,
        authorId: users[1]._id,
        content: "Start with user research and understanding your target audience.",
      },
    ]);

    // Nested reply (reply to a reply)
    const nestedReply = await ForumReplyModel.create({
      postId: posts[0]._id,
      authorId: users[2]._id,
      content: "Thank you! Looking forward to learning together.",
      parentReplyId: replies[0]._id,
    });

    // Attendance (3)
    const attendance = await AttendanceModel.create([
      {
        courseId: courses[0]._id,
        studentId: users[2]._id,
        date: new Date(),
        status: AttendanceStatus.PRESENT,
        markedBy: users[1]._id,
      },
      {
        courseId: courses[0]._id,
        studentId: users[3]._id,
        date: new Date(),
        status: AttendanceStatus.ABSENT,
        markedBy: users[1]._id,
      },
      {
        courseId: courses[1]._id,
        studentId: users[2]._id,
        date: new Date(Date.now() - 24 * 3600 * 1000), // Yesterday
        status: AttendanceStatus.LATE,
        markedBy: users[1]._id,
      },
    ]);

    // Notifications (3)
    const notifications = await NotificationModel.create([
      {
        title: "Welcome to LMS",
        message: "Welcome to our Learning Management System! Start exploring courses.",
        sender: users[0]._id,
        recipientUser: users[2]._id,
        recipientType: NotificationType.USER,
        isRead: false,
      },
      {
        title: "Assignment Due Soon",
        message: "JS Exercise 1 is due in 7 days. Don't forget to submit!",
        sender: users[1]._id,
        recipientUser: users[3]._id,
        recipientType: NotificationType.USER,
        isRead: false,
      },
      {
        title: "New Quiz Available",
        message: "A new quiz has been published in JavaScript course",
        sender: users[1]._id,
        recipientCourse: courses[0]._id,
        recipientType: NotificationType.COURSE,
        isRead: false,
      },
    ]);

    // Announcements (2)
    const announcements = await AnnouncementModel.create([
      {
        title: "New Course Available",
        content: "We're excited to announce our new JavaScript course! Enrollment is now open.",
        courseId: courses[0]._id,
        authorId: users[1]._id,
        publishedAt: new Date(),
      },
      {
        title: "System Maintenance Scheduled",
        content: "System maintenance is scheduled for this weekend. The platform may be unavailable for a few hours.",
        courseId: null,
        authorId: users[0]._id,
        publishedAt: new Date(),
      },
    ]);

    console.log("Seeding finished");
    console.log(`Created:`);
    console.log(`- ${users.length} users`);
    console.log(`- ${majors.length} majors`);
    console.log(`- ${specialists.length} specialists`);
    console.log(`- ${subjects.length} subjects`);
    console.log(`- ${courses.length} courses`);
    console.log(`- ${enrollments.length} enrollments`);
    console.log(`- ${lessons.length} lessons`);
    console.log(`- ${materials.length} lesson materials`);
    console.log(`- ${progresses.length} lesson progresses`);
    console.log(`- ${assignments.length} assignments`);
    console.log(`- ${submissions.length} submissions`);
    console.log(`- ${quizQuestions.length} quiz questions`);
    console.log(`- ${quizzes.length} quizzes`);
    console.log(`- ${quizAttempts.length} quiz attempts`);
    console.log(`- ${forums.length} forums`);
    console.log(`- ${posts.length} forum posts`);
    console.log(`- ${replies.length} forum replies`);
    console.log(`- ${attendance.length} attendance records`);
    console.log(`- ${notifications.length} notifications`);
    console.log(`- ${announcements.length} announcements`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
