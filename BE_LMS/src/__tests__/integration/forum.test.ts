// Forum API Integration Tests
import request from "supertest";
import { createApp } from "@/app";
import ForumModel from "@/models/forum.model";
import ForumPostModel from "@/models/forumPost.model";
import ForumReplyModel from "@/models/forumReply.model";
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import { loginUser } from "../helpers/loginUser";
import { Role } from "@/types";
import { ForumType } from "@/types/forum.type";
import mongoose from "mongoose";

describe("💬 Forum API Integration Tests", () => {
  let app: any;
  let courseId: string;
  let teacherId: string;
  let studentId: string;
  let adminId: string;
  let forumId: string;
  let postId: string;
  let replyId: string;
  let teacherCookie: any;
  let studentCookie: any;
  let adminCookie: any;

  const teacherEmail = "teacher1@example.com";
  const teacherPassword = "123456";
  const studentEmail = "student1@example.com";
  const studentPassword = "123456";
  const adminEmail = "admin1@example.com";
  const adminPassword = "123456";

  // Setup: Create test data and login before all tests
  beforeAll(async () => {
    // Initialize the app
    app = await createApp();

    // Login with existing accounts
    teacherCookie = await loginUser(app, teacherEmail, teacherPassword);
    studentCookie = await loginUser(app, studentEmail, studentPassword);
    adminCookie = await loginUser(app, adminEmail, adminPassword);

    // Get user IDs
    const teacher = await UserModel.findOne({ email: teacherEmail });
    const student = await UserModel.findOne({ email: studentEmail });
    const admin = await UserModel.findOne({ email: adminEmail });
    teacherId = teacher!._id.toString();
    studentId = student!._id.toString();
    adminId = admin!._id.toString();

    // Create a course for testing
    const course = await CourseModel.create({
      title: "Forum Integration Test Course",
      subjectId: new mongoose.Types.ObjectId(),
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      teacherIds: [teacherId],
    });
    courseId = (course._id as mongoose.Types.ObjectId).toString();
  });

  // Cleanup after each test
  afterEach(async () => {
    await ForumModel.deleteMany({ courseId });
    await ForumPostModel.deleteMany({});
    await ForumReplyModel.deleteMany({});
  });

  // ===================================
  // FORUM ROUTES - PUBLIC
  // ===================================
  describe("GET /forums (Public)", () => {
    beforeEach(async () => {
      // Create test forums
      await ForumModel.create({
        courseId,
        title: "General Discussion",
        description: "A place for general course discussions",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      await ForumModel.create({
        courseId,
        title: "Course Announcements",
        description: "Important announcements from instructors",
        forumType: ForumType.ANNOUNCEMENT,
        createdBy: teacherId,
      });
    });

    it("should list all forums in a course with pagination", async () => {
      const res = await request(app).get("/forums").query({
        courseId,
        page: 1,
        limit: 10,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forums retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
    });

    it("should filter forums by title", async () => {
      const res = await request(app).get("/forums").query({
        courseId,
        title: "General",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.some((f: any) => f.title.includes("General"))).toBe(true);
    });

    it("should filter forums by forumType", async () => {
      const res = await request(app).get("/forums").query({
        courseId,
        forumType: ForumType.ANNOUNCEMENT,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.every((f: any) => f.forumType === ForumType.ANNOUNCEMENT)).toBe(true);
    });

    it("should search forums by text", async () => {
      const res = await request(app).get("/forums").query({
        courseId,
        search: "announcement",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should fail without courseId", async () => {
      const res = await request(app).get("/forums");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /forums/:id (Public)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum Detail",
        description: "Forum for detail test",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();
    });

    it("should get forum by ID", async () => {
      const res = await request(app).get(`/forums/${forumId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(forumId);
      expect(res.body.data.title).toBe("Test Forum Detail");
    });

    it("should return 404 for non-existent forum", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/forums/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid forum ID", async () => {
      const res = await request(app).get("/forums/invalid-id");

      expect(res.status).toBe(400);
    });
  });

  // ===================================
  // FORUM ROUTES - PROTECTED
  // ===================================
  describe("POST /forums (Protected)", () => {
    it("should create a discussion forum as teacher", async () => {
      const res = await request(app)
        .post("/forums")
        .set("Cookie", teacherCookie)
        .send({
          courseId,
          title: "New Discussion Forum",
          description: "A new forum for discussions",
          forumType: ForumType.DISCUSSION,
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Forum created successfully");
      expect(res.body.data.title).toBe("New Discussion Forum");
      expect(res.body.data.forumType).toBe(ForumType.DISCUSSION);
      expect(res.body.data.courseId).toBe(courseId);
    });

    it("should create an announcement forum as teacher", async () => {
      const res = await request(app)
        .post("/forums")
        .set("Cookie", teacherCookie)
        .send({
          courseId,
          title: "Important Announcements",
          forumType: ForumType.ANNOUNCEMENT,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.forumType).toBe(ForumType.ANNOUNCEMENT);
    });

    it("should create a forum as admin", async () => {
      const res = await request(app)
        .post("/forums")
        .set("Cookie", adminCookie)
        .send({
          courseId,
          title: "Admin Forum",
          forumType: ForumType.DISCUSSION,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Admin Forum");
    });

    it("should fail to create forum as student", async () => {
      const res = await request(app)
        .post("/forums")
        .set("Cookie", studentCookie)
        .send({
          courseId,
          title: "Student Forum",
          forumType: ForumType.DISCUSSION,
        });

      expect(res.status).toBe(403);
    });

    it("should fail to create forum without authentication", async () => {
      const res = await request(app).post("/forums").send({
        courseId,
        title: "Unauthenticated Forum",
        forumType: ForumType.DISCUSSION,
      });

      expect(res.status).toBe(401);
    });

    it("should fail to create forum without required fields", async () => {
      const res = await request(app)
        .post("/forums")
        .set("Cookie", teacherCookie)
        .send({
          courseId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /forums/:id (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Original Title",
        description: "Original description",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();
    });

    it("should update forum as teacher", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}`)
        .set("Cookie", teacherCookie)
        .send({
          title: "Updated Title",
          description: "Updated description",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum updated successfully");
      expect(res.body.data.title).toBe("Updated Title");
      expect(res.body.data.description).toBe("Updated description");
    });

    it("should update forum as admin", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}`)
        .set("Cookie", adminCookie)
        .send({
          title: "Admin Updated",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Admin Updated");
    });

    it("should fail to update forum as student", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}`)
        .set("Cookie", studentCookie)
        .send({
          title: "Student Update",
        });

      expect(res.status).toBe(403);
    });

    it("should fail to update forum without authentication", async () => {
      const res = await request(app).patch(`/forums/${forumId}`).send({
        title: "Unauthorized Update",
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent forum", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/forums/${fakeId}`)
        .set("Cookie", teacherCookie)
        .send({
          title: "Update Non-existent",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /forums/:id (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Forum to Delete",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();
    });

    it("should delete forum as teacher", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}`)
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum deleted successfully");

      // Verify deletion
      const deleted = await ForumModel.findById(forumId);
      expect(deleted).toBeNull();
    });

    it("should delete forum as admin", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
    });

    it("should fail to delete forum as student", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}`)
        .set("Cookie", studentCookie);

      expect(res.status).toBe(403);
    });

    it("should fail to delete forum without authentication", async () => {
      const res = await request(app).delete(`/forums/${forumId}`);

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent forum", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/forums/${fakeId}`)
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(404);
    });
  });

  // ===================================
  // FORUM POST ROUTES - PUBLIC
  // ===================================
  describe("GET /forums/:forumId/posts (Public)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      // Create test posts
      await ForumPostModel.create({
        forumId,
        authorId: teacherId,
        title: "First Post",
        content: "This is the first post",
      });
      await ForumPostModel.create({
        forumId,
        authorId: studentId,
        title: "Second Post",
        content: "This is the second post",
      });
    });

    it("should list all posts in a forum with pagination", async () => {
      const res = await request(app).get(`/forums/${forumId}/posts`).query({
        page: 1,
        limit: 10,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum posts retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
    });

    it("should filter posts by title", async () => {
      const res = await request(app).get(`/forums/${forumId}/posts`).query({
        title: "First",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.some((p: any) => p.title.includes("First"))).toBe(true);
    });

    it("should search posts by text", async () => {
      const res = await request(app).get(`/forums/${forumId}/posts`).query({
        search: "second",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe("GET /forums/:forumId/posts/:id (Public)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: studentId,
        title: "Test Post Detail",
        content: "Post content for detail test",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();
    });

    it("should get post by ID", async () => {
      const res = await request(app).get(`/forums/${forumId}/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum post retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(postId);
      expect(res.body.data.title).toBe("Test Post Detail");
    });

    it("should return 404 for non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/forums/${forumId}/posts/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  // ===================================
  // FORUM POST ROUTES - PROTECTED
  // ===================================
  describe("POST /forums/:forumId/posts (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();
    });

    it("should create post as teacher", async () => {
      const res = await request(app)
        .post(`/forums/${forumId}/posts`)
        .set("Cookie", teacherCookie)
        .send({
          title: "Teacher Post",
          content: "Content from teacher",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Forum post created successfully");
      expect(res.body.data.title).toBe("Teacher Post");
      expect(res.body.data.authorId).toBeDefined();
    });

    it("should create post as student", async () => {
      const res = await request(app)
        .post(`/forums/${forumId}/posts`)
        .set("Cookie", studentCookie)
        .send({
          title: "Student Post",
          content: "Content from student",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Student Post");
    });

    it("should fail to create post without authentication", async () => {
      const res = await request(app).post(`/forums/${forumId}/posts`).send({
        title: "Unauthorized Post",
        content: "This should fail",
      });

      expect(res.status).toBe(401);
    });

    it("should fail to create post without required fields", async () => {
      const res = await request(app)
        .post(`/forums/${forumId}/posts`)
        .set("Cookie", studentCookie)
        .send({
          title: "Missing Content",
        });

      expect(res.status).toBe(400);
    });

    it("should fail with non-existent forum", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/forums/${fakeId}/posts`)
        .set("Cookie", studentCookie)
        .send({
          title: "Test Post",
          content: "Test content",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /forums/:forumId/posts/:id (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: studentId,
        title: "Original Post Title",
        content: "Original post content",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();
    });

    it("should update own post as student", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}/posts/${postId}`)
        .set("Cookie", studentCookie)
        .send({
          title: "Updated Post Title",
          content: "Updated post content",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum post updated successfully");
      expect(res.body.data.title).toBe("Updated Post Title");
    });

    it("should update any post as teacher", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}/posts/${postId}`)
        .set("Cookie", teacherCookie)
        .send({
          title: "Teacher Updated",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Teacher Updated");
    });

    it("should fail to update others' post as student", async () => {
      // Create another student's post
      const anotherStudent = await UserModel.findOne({
        role: Role.STUDENT,
        _id: { $ne: studentId },
      });

      const otherPost = await ForumPostModel.create({
        forumId,
        authorId: anotherStudent?._id,
        title: "Other Student Post",
        content: "Content",
      });

      const res = await request(app)
        .patch(`/forums/${forumId}/posts/${(otherPost._id as mongoose.Types.ObjectId).toString()}`)
        .set("Cookie", studentCookie)
        .send({
          title: "Trying to update",
        });

      expect(res.status).toBe(403);
    });

    it("should fail to update post without authentication", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}/posts/${postId}`)
        .send({
          title: "Unauthorized Update",
        });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /forums/:forumId/posts/:id (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: studentId,
        title: "Post to Delete",
        content: "This post will be deleted",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();
    });

    it("should delete own post as student", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}/posts/${postId}`)
        .set("Cookie", studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum post deleted successfully");

      // Verify deletion
      const deleted = await ForumPostModel.findById(postId);
      expect(deleted).toBeNull();
    });

    it("should delete any post as teacher", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}/posts/${postId}`)
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(200);
    });

    it("should delete any post as admin", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}/posts/${postId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
    });

    it("should fail to delete post without authentication", async () => {
      const res = await request(app).delete(`/forums/${forumId}/posts/${postId}`);

      expect(res.status).toBe(401);
    });
  });

  // ===================================
  // FORUM REPLY ROUTES - PUBLIC
  // ===================================
  describe("GET /forums/:forumId/posts/:postId/replies (Public)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: teacherId,
        title: "Post with Replies",
        content: "Content",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();

      // Create test replies
      await ForumReplyModel.create({
        postId,
        authorId: studentId,
        content: "First reply",
      });
      await ForumReplyModel.create({
        postId,
        authorId: teacherId,
        content: "Second reply",
      });
    });

    it("should list all replies in a post with pagination", async () => {
      const res = await request(app)
        .get(`/forums/${forumId}/posts/${postId}/replies`)
        .query({
          page: 1,
          limit: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum replies retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
    });

    it("should search replies by text", async () => {
      const res = await request(app)
        .get(`/forums/${forumId}/posts/${postId}/replies`)
        .query({
          search: "first",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe("GET /forums/:forumId/posts/:postId/replies/:id (Public)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: teacherId,
        title: "Test Post",
        content: "Content",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();

      const reply = await ForumReplyModel.create({
        postId,
        authorId: studentId,
        content: "Test reply for detail",
      });
      replyId = (reply._id as mongoose.Types.ObjectId).toString();
    });

    it("should get reply by ID", async () => {
      const res = await request(app).get(
        `/forums/${forumId}/posts/${postId}/replies/${replyId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum reply retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(replyId);
      expect(res.body.data.content).toBe("Test reply for detail");
    });

    it("should return 404 for non-existent reply", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(
        `/forums/${forumId}/posts/${postId}/replies/${fakeId}`
      );

      expect(res.status).toBe(404);
    });
  });

  // ===================================
  // FORUM REPLY ROUTES - PROTECTED
  // ===================================
  describe("POST /forums/:forumId/posts/:postId/replies (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: teacherId,
        title: "Test Post",
        content: "Post content",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();
    });

    it("should create reply as student", async () => {
      const res = await request(app)
        .post(`/forums/${forumId}/posts/${postId}/replies`)
        .set("Cookie", studentCookie)
        .send({
          content: "Student reply content",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Forum reply created successfully");
      expect(res.body.data.content).toBe("Student reply content");
      expect(res.body.data.authorId).toBeDefined();
    });

    it("should create reply as teacher", async () => {
      const res = await request(app)
        .post(`/forums/${forumId}/posts/${postId}/replies`)
        .set("Cookie", teacherCookie)
        .send({
          content: "Teacher reply content",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe("Teacher reply content");
    });

    it("should create nested reply", async () => {
      // Create parent reply first
      const parentReply = await ForumReplyModel.create({
        postId,
        authorId: teacherId,
        content: "Parent reply",
      });

      const res = await request(app)
        .post(`/forums/${forumId}/posts/${postId}/replies`)
        .set("Cookie", studentCookie)
        .send({
          content: "Nested reply content",
          parentReplyId: (parentReply._id as mongoose.Types.ObjectId).toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parentReplyId).toBeDefined();
    });

    it("should fail to create reply without authentication", async () => {
      const res = await request(app)
        .post(`/forums/${forumId}/posts/${postId}/replies`)
        .send({
          content: "Unauthorized reply",
        });

      expect(res.status).toBe(401);
    });

    it("should fail to create reply without required fields", async () => {
      const res = await request(app)
        .post(`/forums/${forumId}/posts/${postId}/replies`)
        .set("Cookie", studentCookie)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /forums/:forumId/posts/:postId/replies/:id (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: teacherId,
        title: "Test Post",
        content: "Content",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();

      const reply = await ForumReplyModel.create({
        postId,
        authorId: studentId,
        content: "Original reply content",
      });
      replyId = (reply._id as mongoose.Types.ObjectId).toString();
    });

    it("should update own reply as student", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}/posts/${postId}/replies/${replyId}`)
        .set("Cookie", studentCookie)
        .send({
          content: "Updated reply content",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum reply updated successfully");
      expect(res.body.data.content).toBe("Updated reply content");
    });

    it("should update any reply as teacher", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}/posts/${postId}/replies/${replyId}`)
        .set("Cookie", teacherCookie)
        .send({
          content: "Teacher updated reply",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe("Teacher updated reply");
    });

    it("should fail to update reply without authentication", async () => {
      const res = await request(app)
        .patch(`/forums/${forumId}/posts/${postId}/replies/${replyId}`)
        .send({
          content: "Unauthorized update",
        });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /forums/:forumId/posts/:postId/replies/:id (Protected)", () => {
    beforeEach(async () => {
      const forum = await ForumModel.create({
        courseId,
        title: "Test Forum",
        forumType: ForumType.DISCUSSION,
        createdBy: teacherId,
      });
      forumId = (forum._id as mongoose.Types.ObjectId).toString();

      const post = await ForumPostModel.create({
        forumId,
        authorId: teacherId,
        title: "Test Post",
        content: "Content",
      });
      postId = (post._id as mongoose.Types.ObjectId).toString();

      const reply = await ForumReplyModel.create({
        postId,
        authorId: studentId,
        content: "Reply to delete",
      });
      replyId = (reply._id as mongoose.Types.ObjectId).toString();
    });

    it("should delete own reply as student", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}/posts/${postId}/replies/${replyId}`)
        .set("Cookie", studentCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Forum reply deleted successfully");

      // Verify deletion
      const deleted = await ForumReplyModel.findById(replyId);
      expect(deleted).toBeNull();
    });

    it("should delete any reply as teacher", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}/posts/${postId}/replies/${replyId}`)
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(200);
    });

    it("should delete any reply as admin", async () => {
      const res = await request(app)
        .delete(`/forums/${forumId}/posts/${postId}/replies/${replyId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
    });

    it("should fail to delete reply without authentication", async () => {
      const res = await request(app).delete(
        `/forums/${forumId}/posts/${postId}/replies/${replyId}`
      );

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent reply", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/forums/${forumId}/posts/${postId}/replies/${fakeId}`)
        .set("Cookie", studentCookie);

      expect(res.status).toBe(404);
    });
  });
});

