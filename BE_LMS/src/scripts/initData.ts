// src/scripts/initData.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

// import tất cả models
import {
  User,
  Category,
  Course,
  Enrollment,
  Lesson,
  LessonMaterial,
  Assignment,
  Submission,
  Quiz,
  QuizAttempt,
  Forum,
  ForumPost,
  ForumReply,
  Attendance,
  Notification,
  Announcement,
} from "../models";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;

async function init() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // Clear old data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Lesson.deleteMany({}),
      LessonMaterial.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Quiz.deleteMany({}),
      QuizAttempt.deleteMany({}),
      Forum.deleteMany({}),
      ForumPost.deleteMany({}),
      ForumReply.deleteMany({}),
      Attendance.deleteMany({}),
      Notification.deleteMany({}),
      Announcement.deleteMany({}),
    ]);
    console.log("Old data cleared");

    // Create Users
    const password = "123456"; // Model sẽ tự động hash trong pre-save hook
    const users = await User.create([
      {
        username: "admin1",
        email: "admin1@example.com",
        password,
        role: "admin",
        fullname: "Admin One",
        verified: true, 
      },
      {
        username: "teacher1",
        email: "teacher1@example.com",
        password,
        role: "teacher",
        fullname: "Teacher One", 
        verified: true, 
      },
      {
        username: "student1",
        email: "student1@example.com",
        password,
        role: "student",
        fullname: "Student One", 
        verified: true, 
      },
      {
        username: "student2",
        email: "student2@example.com",
        password,
        role: "student",
        fullname: "Student Two", 
        verified: true, 
      },
    ]);

    // Create Categories
    const categories = await Category.create([
      { name: "Programming", slug: "programming" },
      { name: "Design", slug: "design" },
    ]);

    // Create Courses
    const courses = await Course.create([
      {
        title: "Intro to JavaScript",
        code: "JS101",
        description: "Learn JavaScript from scratch",
        category: categories[0]._id,
        teachers: [users[1]._id],
        isPublished: true,
        capacity: 50,
      },
      {
        title: "UI/UX Design",
        code: "UX101",
        description: "Learn UI/UX Design",
        category: categories[1]._id,
        teachers: [users[1]._id],
        isPublished: true,
        capacity: 30,
      },
    ]);

    // Enroll students
    const enrollments = await Enrollment.create([
      { studentId: users[2]._id, courseId: courses[0]._id, status: "active" },
      { studentId: users[3]._id, courseId: courses[0]._id, status: "active" },
      { studentId: users[2]._id, courseId: courses[1]._id, status: "active" },
    ]);

    // Lessons
    const lessons = await Lesson.create([
      {
        title: "JS Basics",
        courseId: courses[0]._id,
        content: "Learn the basics of JavaScript programming language",
        order: 1,
        durationMinutes: 30,
        publishedAt: new Date(),
      },
      {
        title: "JS Functions",
        courseId: courses[0]._id,
        content: "Understanding JavaScript functions and their usage",
        order: 2,
        durationMinutes: 45,
        publishedAt: new Date(),
      },
      {
        title: "UI Design Principles",
        courseId: courses[1]._id,
        content: "Fundamental principles of UI/UX design",
        order: 1,
        durationMinutes: 60,
        publishedAt: new Date(), 
      },
    ]);

    // Lesson Materials
    const materials = await LessonMaterial.create([
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

    // Assignments
    const assignments = await Assignment.create([
      {
        courseId: courses[0]._id,
        title: "JS Exercise 1",
        maxScore: 100,
        createdBy: users[1]._id,
        dueDate: new Date(),
      },
      {
        courseId: courses[1]._id,
        title: "Design Project",
        maxScore: 100,
        createdBy: users[1]._id,
        dueDate: new Date(),
      },
    ]);

    // Submissions
    const submissions = await Submission.create([
      {
        assignmentId: assignments[0]._id,
        studentId: users[2]._id,
        fileUrl: "/submissions/js1.pdf",
        submittedAt: new Date(),
      },
    ]);

    // Quiz
    const quiz = await Quiz.create({
      courseId: courses[0]._id,
      title: "JS Quiz 1",
      questions: [
        {
          text: "What is JS?",
          type: "mcq",
          options: ["Language", "Framework"],
          correct: 0,
        },
        { text: "JS is client-side?", type: "truefalse", correct: true },
      ],
    });

    // QuizAttempt
    const quizAttempt = await QuizAttempt.create({
      quizId: quiz._id,
      studentId: users[2]._id,
      status: "in_progress",
    });

    // Forum
    const forum = await Forum.create({
      courseId: courses[0]._id,
      title: "General Discussion",
      createdBy: users[1]._id,
    });
    const post = await ForumPost.create({
      forumId: forum._id,
      authorId: users[2]._id,
      content: "Hello everyone!",
    });
    const reply = await ForumReply.create({
      postId: post._id,
      authorId: users[1]._id,
      content: "Welcome!",
    });

    // Attendance
    const attendance = await Attendance.create({
      courseId: courses[0]._id,
      studentId: users[2]._id,
      date: new Date(),
      status: "present",
      markedBy: users[1]._id,
    });

    // Notifications
    const notification = await Notification.create({
      title: "Welcome",
      message: "Welcome to LMS!",
      recipientUser: users[2]._id,
    });

    // Announcements
    const announcement = await Announcement.create({
      title: "New Course Available",
      content: "Check out our new courses!",
      courseId: courses[0]._id,
      authorId: users[1]._id,
    });

    console.log("Sample data initialized successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

init();
