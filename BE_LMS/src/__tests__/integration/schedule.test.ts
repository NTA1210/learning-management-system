// Schedule API Integration Tests
import request from "supertest";
import { createApp } from "@/app";
import ScheduleModel from "@/models/schedule.model";
import ScheduleExceptionModel from "@/models/scheduleException.model";
import TimeSlotModel from "@/models/timeSlot.model";
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import { loginUser } from "../helpers/loginUser";
import { Role } from "@/types";
import { DayOfWeek } from "@/types/timeSlot.type";
import { ScheduleStatus } from "@/types/schedule.type";
import { ExceptionStatus, ExceptionType } from "@/types/scheduleException.type";
import mongoose from "mongoose";

describe("📅 Schedule API Integration Tests", () => {
  let app: any;
  let courseId: string;
  let teacherId: string;
  let adminId: string;
  let timeSlotId: string;
  let scheduleId: string;
  let adminCookie: any;
  let teacherCookie: any;
  let studentCookie: any;

  const adminEmail = "admin1@example.com";
  const adminPassword = "123456";
  const teacherEmail = "teacher1@example.com";
  const teacherPassword = "123456";
  const studentEmail = "student1@example.com";
  const studentPassword = "123456";

  // Setup: Create test data and login before all tests
  beforeAll(async () => {
    // Initialize the app
    app = await createApp();

    // Login with existing accounts
    adminCookie = await loginUser(app, adminEmail, adminPassword);
    teacherCookie = await loginUser(app, teacherEmail, teacherPassword);
    studentCookie = await loginUser(app, studentEmail, studentPassword);

    // Get user IDs
    const admin = await UserModel.findOne({ email: adminEmail });
    const teacher = await UserModel.findOne({ email: teacherEmail });
    adminId = admin!._id.toString();
    teacherId = teacher!._id.toString();

    // Create a time slot for testing
    const timeSlot = await TimeSlotModel.create({
      slotName: "Slot 1",
      startTime: "08:00",
      endTime: "10:00",
      order: 1,
      isActive: true,
    });
    timeSlotId = (timeSlot._id as mongoose.Types.ObjectId).toString();

    // Create a course for testing
    const course = await CourseModel.create({
      title: "Schedule Integration Test Course",
      subjectId: new mongoose.Types.ObjectId(),
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      teacherIds: [teacherId],
    });
    courseId = (course._id as mongoose.Types.ObjectId).toString();
  });

  // Cleanup after each test
  afterEach(async () => {
    await ScheduleModel.deleteMany({ courseId });
    await ScheduleExceptionModel.deleteMany({});
  });

  // -------------------
  // Time Slots (Public)
  // -------------------
  describe("GET /schedules/time-slots", () => {
    it("should get all active time slots without authentication", async () => {
      const res = await request(app).get("/schedules/time-slots").query({
        isActive: "true",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Time slots retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should get all time slots without filter", async () => {
      const res = await request(app).get("/schedules/time-slots");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should filter time slots by isActive=false", async () => {
      const res = await request(app).get("/schedules/time-slots").query({
        isActive: "false",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  // -------------------
  // Create Schedule Request (Protected - Teacher/Admin)
  // -------------------
  describe("POST /schedules", () => {
    it("should create a schedule request as teacher with single slot", async () => {
      const res = await request(app)
        .post("/schedules")
        .set("Cookie", teacherCookie)
        .send({
          courseId,
          slots: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              timeSlotId,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("Schedule request created successfully");
      expect(res.body.message).toContain("1 slot");
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe(ScheduleStatus.PENDING);

      scheduleId = res.body.data[0]._id;
    });

    it("should create a schedule request as admin with multiple slots", async () => {
      const res = await request(app)
        .post("/schedules")
        .set("Cookie", adminCookie)
        .send({
          courseId,
          slots: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              timeSlotId,
            },
            {
              dayOfWeek: DayOfWeek.WEDNESDAY,
              timeSlotId,
            },
            {
              dayOfWeek: DayOfWeek.FRIDAY,
              timeSlotId,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("3 slots");
      expect(res.body.data.length).toBe(3);
    });

    it("should fail to create schedule request without authentication", async () => {
      const res = await request(app).post("/schedules").send({
        courseId,
        slots: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            timeSlotId,
          },
        ],
      });

      expect(res.status).toBe(401);
    });

    it("should fail to create schedule request as student", async () => {
      const res = await request(app)
        .post("/schedules")
        .set("Cookie", studentCookie)
        .send({
          courseId,
          slots: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              timeSlotId,
            },
          ],
        });

      expect(res.status).toBe(403);
    });

    it("should fail to create schedule request without required fields", async () => {
      const res = await request(app)
        .post("/schedules")
        .set("Cookie", teacherCookie)
        .send({
          courseId,
        });

      expect(res.status).toBe(400);
    });

    it("should fail to create schedule request with invalid courseId", async () => {
      const res = await request(app)
        .post("/schedules")
        .set("Cookie", teacherCookie)
        .send({
          courseId: "invalid-id",
          slots: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              timeSlotId,
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it("should fail to create schedule request with empty slots array", async () => {
      const res = await request(app)
        .post("/schedules")
        .set("Cookie", teacherCookie)
        .send({
          courseId,
          slots: [],
        });

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Get Teacher Schedule (Protected)
  // -------------------
  describe("GET /schedules/per-teacher/:teacherId", () => {
    beforeEach(async () => {
      // Create approved schedule for testing
      await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.MONDAY,
        timeSlotId,
        status: ScheduleStatus.APPROVED,
      });
    });

    it("should get teacher schedule with authentication", async () => {
      const res = await request(app)
        .get(`/schedules/per-teacher/${teacherId}`)
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Teacher schedule retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.teacher).toBeDefined();
      expect(res.body.data.schedule).toBeDefined();
    });

    it("should get teacher schedule with date parameter", async () => {
      const res = await request(app)
        .get(`/schedules/per-teacher/${teacherId}`)
        .set("Cookie", teacherCookie)
        .query({ date: "2024-12-15" });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should get teacher schedule with status filter", async () => {
      const res = await request(app)
        .get(`/schedules/per-teacher/${teacherId}`)
        .set("Cookie", teacherCookie)
        .query({ status: ScheduleStatus.APPROVED });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should fail to get teacher schedule without authentication", async () => {
      const res = await request(app).get(`/schedules/per-teacher/${teacherId}`);

      expect(res.status).toBe(401);
    });

    it("should fail with invalid teacherId", async () => {
      const res = await request(app)
        .get("/schedules/per-teacher/invalid-id")
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Get Course Schedule (Protected)
  // -------------------
  describe("GET /schedules/per-course/:courseId", () => {
    beforeEach(async () => {
      // Create approved schedule for testing
      await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        timeSlotId,
        status: ScheduleStatus.APPROVED,
      });
    });

    it("should get course schedule with authentication", async () => {
      const res = await request(app)
        .get(`/schedules/per-course/${courseId}`)
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Course schedule retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.course).toBeDefined();
      expect(res.body.data.schedule).toBeDefined();
    });

    it("should get course schedule with status filter", async () => {
      const res = await request(app)
        .get(`/schedules/per-course/${courseId}`)
        .set("Cookie", teacherCookie)
        .query({ status: ScheduleStatus.APPROVED });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should fail to get course schedule without authentication", async () => {
      const res = await request(app).get(`/schedules/per-course/${courseId}`);

      expect(res.status).toBe(401);
    });

    it("should fail with invalid courseId", async () => {
      const res = await request(app)
        .get("/schedules/per-course/invalid-id")
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Check Slot Availability (Protected)
  // -------------------
  describe("GET /schedules/check-availability", () => {
    it("should check if slot is available", async () => {
      const res = await request(app)
        .get("/schedules/check-availability")
        .set("Cookie", teacherCookie)
        .query({
          teacherId,
          dayOfWeek: DayOfWeek.TUESDAY,
          timeSlotId,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.available).toBeDefined();
      expect(typeof res.body.data.available).toBe("boolean");
    });

    it("should return unavailable for booked slot", async () => {
      // Create a schedule to make the slot unavailable
      await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.THURSDAY,
        timeSlotId,
        status: ScheduleStatus.APPROVED,
      });

      const res = await request(app)
        .get("/schedules/check-availability")
        .set("Cookie", teacherCookie)
        .query({
          teacherId,
          dayOfWeek: DayOfWeek.THURSDAY,
          timeSlotId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(false);
      expect(res.body.message).toContain("already booked");
    });

    it("should fail to check availability without authentication", async () => {
      const res = await request(app).get("/schedules/check-availability").query({
        teacherId,
        dayOfWeek: DayOfWeek.MONDAY,
        timeSlotId,
      });

      expect(res.status).toBe(401);
    });

    it("should fail with missing query parameters", async () => {
      const res = await request(app)
        .get("/schedules/check-availability")
        .set("Cookie", teacherCookie)
        .query({
          teacherId,
        });

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Get Pending Schedule Requests (Protected - Admin only)
  // -------------------
  describe("GET /schedules/pending", () => {
    beforeEach(async () => {
      // Create pending schedules
      await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.MONDAY,
        timeSlotId,
        status: ScheduleStatus.PENDING,
      });
      await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        timeSlotId,
        status: ScheduleStatus.PENDING,
      });
    });

    it("should get all pending schedule requests as admin", async () => {
      const res = await request(app)
        .get("/schedules/pending")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Pending requests retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("should fail to get pending requests as teacher", async () => {
      const res = await request(app)
        .get("/schedules/pending")
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(403);
    });

    it("should fail to get pending requests without authentication", async () => {
      const res = await request(app).get("/schedules/pending");

      expect(res.status).toBe(401);
    });
  });

  // -------------------
  // Approve/Reject Schedule Request (Protected - Admin only)
  // -------------------
  describe("PATCH /schedules/:scheduleId/approve", () => {
    let pendingScheduleId: string;

    beforeEach(async () => {
      const schedule = await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.FRIDAY,
        timeSlotId,
        status: ScheduleStatus.PENDING,
      });
      pendingScheduleId = (schedule._id as mongoose.Types.ObjectId).toString();
    });

    it("should approve schedule request as admin", async () => {
      const res = await request(app)
        .patch(`/schedules/${pendingScheduleId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: true,
          approvalNote: "Approved for test",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("approved successfully");
      expect(res.body.data.status).toBe(ScheduleStatus.APPROVED);
      expect(res.body.data.approvalNote).toBe("Approved for test");
    });

    it("should reject schedule request as admin", async () => {
      const res = await request(app)
        .patch(`/schedules/${pendingScheduleId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: false,
          approvalNote: "Time slot conflict",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("rejected successfully");
      expect(res.body.data.status).toBe(ScheduleStatus.REJECTED);
      expect(res.body.data.approvalNote).toBe("Time slot conflict");
    });

    it("should approve without approval note", async () => {
      const res = await request(app)
        .patch(`/schedules/${pendingScheduleId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ScheduleStatus.APPROVED);
    });

    it("should fail to approve as teacher", async () => {
      const res = await request(app)
        .patch(`/schedules/${pendingScheduleId}/approve`)
        .set("Cookie", teacherCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(403);
    });

    it("should fail to approve without authentication", async () => {
      const res = await request(app)
        .patch(`/schedules/${pendingScheduleId}/approve`)
        .send({
          approved: true,
        });

      expect(res.status).toBe(401);
    });

    it("should fail with invalid scheduleId", async () => {
      const res = await request(app)
        .patch("/schedules/invalid-id/approve")
        .set("Cookie", adminCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(400);
    });

    it("should fail with non-existent scheduleId", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/schedules/${fakeId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(404);
    });

    it("should fail without required approved field", async () => {
      const res = await request(app)
        .patch(`/schedules/${pendingScheduleId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approvalNote: "Missing approved field",
        });

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Create Schedule Exception (Protected - Teacher only)
  // -------------------
  describe("POST /schedules/exceptions/:scheduleId", () => {
    let approvedScheduleId: string;

    beforeEach(async () => {
      const schedule = await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.MONDAY,
        timeSlotId,
        status: ScheduleStatus.APPROVED,
      });
      approvedScheduleId = (schedule._id as mongoose.Types.ObjectId).toString();
    });

    it("should create cancellation exception as teacher", async () => {
      const res = await request(app)
        .post(`/schedules/exceptions/${approvedScheduleId}`)
        .set("Cookie", teacherCookie)
        .send({
          exceptionDate: new Date("2024-12-25"),
          exceptionType: ExceptionType.CANCELLATION,
          reason: "Holiday - Christmas",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Exception created successfully");
      expect(res.body.data.exceptionType).toBe(ExceptionType.CANCELLATION);
      expect(res.body.data.status).toBe(ExceptionStatus.PENDING);
    });

    it("should create replacement exception with replacement teacher", async () => {
      // Get another teacher
      const anotherTeacher = await UserModel.findOne({
        role: Role.TEACHER,
        _id: { $ne: teacherId },
      });

      const res = await request(app)
        .post(`/schedules/exceptions/${approvedScheduleId}`)
        .set("Cookie", teacherCookie)
        .send({
          exceptionDate: new Date("2024-12-20"),
          exceptionType: ExceptionType.REPLACEMENT,
          reason: "Conference attendance",
          replacementTeacherId: anotherTeacher?._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.exceptionType).toBe(ExceptionType.REPLACEMENT);
      expect(res.body.data.replacementTeacherId).toBeDefined();
    });

    it("should fail to create exception as admin (not teacher role)", async () => {
      const res = await request(app)
        .post(`/schedules/exceptions/${approvedScheduleId}`)
        .set("Cookie", adminCookie)
        .send({
          exceptionDate: new Date("2024-12-25"),
          exceptionType: ExceptionType.CANCELLATION,
          reason: "Test",
        });

      expect(res.status).toBe(403);
    });

    it("should fail to create exception without authentication", async () => {
      const res = await request(app)
        .post(`/schedules/exceptions/${approvedScheduleId}`)
        .send({
          exceptionDate: new Date("2024-12-25"),
          exceptionType: ExceptionType.CANCELLATION,
          reason: "Test",
        });

      expect(res.status).toBe(401);
    });

    it("should fail to create exception without required fields", async () => {
      const res = await request(app)
        .post(`/schedules/exceptions/${approvedScheduleId}`)
        .set("Cookie", teacherCookie)
        .send({
          exceptionDate: new Date("2024-12-25"),
        });

      expect(res.status).toBe(400);
    });

    it("should fail with invalid scheduleId", async () => {
      const res = await request(app)
        .post("/schedules/exceptions/invalid-id")
        .set("Cookie", teacherCookie)
        .send({
          exceptionDate: new Date("2024-12-25"),
          exceptionType: ExceptionType.CANCELLATION,
          reason: "Test",
        });

      expect(res.status).toBe(400);
    });

    it("should fail with non-existent scheduleId", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/schedules/exceptions/${fakeId}`)
        .set("Cookie", teacherCookie)
        .send({
          exceptionDate: new Date("2024-12-25"),
          exceptionType: ExceptionType.CANCELLATION,
          reason: "Test",
        });

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Approve/Reject Schedule Exception (Protected - Admin only)
  // -------------------
  describe("PATCH /schedules/exceptions/:exceptionId/approve", () => {
    let exceptionId: string;
    let approvedScheduleId: string;

    beforeEach(async () => {
      const schedule = await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.TUESDAY,
        timeSlotId,
        status: ScheduleStatus.APPROVED,
      });
      approvedScheduleId = (schedule._id as mongoose.Types.ObjectId).toString();

      const exception = await ScheduleExceptionModel.create({
        scheduleId: approvedScheduleId,
        exceptionDate: new Date("2024-12-30"),
        exceptionType: ExceptionType.CANCELLATION,
        reason: "Test exception",
        status: ExceptionStatus.PENDING,
        requestedBy: teacherId,
      });
      exceptionId = (exception._id as mongoose.Types.ObjectId).toString();
    });

    it("should approve schedule exception as admin", async () => {
      const res = await request(app)
        .patch(`/schedules/exceptions/${exceptionId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: true,
          approvalNote: "Exception approved",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("approved successfully");
      expect(res.body.data.status).toBe(ExceptionStatus.APPROVED);
      expect(res.body.data.approvalNote).toBe("Exception approved");
    });

    it("should reject schedule exception as admin", async () => {
      const res = await request(app)
        .patch(`/schedules/exceptions/${exceptionId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: false,
          approvalNote: "Invalid reason",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("rejected successfully");
      expect(res.body.data.status).toBe(ExceptionStatus.REJECTED);
    });

    it("should approve without approval note", async () => {
      const res = await request(app)
        .patch(`/schedules/exceptions/${exceptionId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ExceptionStatus.APPROVED);
    });

    it("should fail to approve as teacher", async () => {
      const res = await request(app)
        .patch(`/schedules/exceptions/${exceptionId}/approve`)
        .set("Cookie", teacherCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(403);
    });

    it("should fail to approve without authentication", async () => {
      const res = await request(app)
        .patch(`/schedules/exceptions/${exceptionId}/approve`)
        .send({
          approved: true,
        });

      expect(res.status).toBe(401);
    });

    it("should fail with invalid exceptionId", async () => {
      const res = await request(app)
        .patch("/schedules/exceptions/invalid-id/approve")
        .set("Cookie", adminCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(400);
    });

    it("should fail with non-existent exceptionId", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/schedules/exceptions/${fakeId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approved: true,
        });

      expect(res.status).toBe(404);
    });

    it("should fail without required approved field", async () => {
      const res = await request(app)
        .patch(`/schedules/exceptions/${exceptionId}/approve`)
        .set("Cookie", adminCookie)
        .send({
          approvalNote: "Missing approved field",
        });

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Get Schedule with Exceptions (Protected)
  // -------------------
  describe("GET /schedules/exceptions/:courseId", () => {
    beforeEach(async () => {
      // Create approved schedule with exception
      const schedule = await ScheduleModel.create({
        courseId,
        teacherId,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        timeSlotId,
        status: ScheduleStatus.APPROVED,
      });

      await ScheduleExceptionModel.create({
        scheduleId: (schedule._id as mongoose.Types.ObjectId).toString(),
        exceptionDate: new Date("2024-12-15"),
        exceptionType: ExceptionType.CANCELLATION,
        reason: "Test exception for retrieval",
        status: ExceptionStatus.APPROVED,
        requestedBy: teacherId,
      });
    });

    it("should get schedule with exceptions for date range", async () => {
      const res = await request(app)
        .get(`/schedules/exceptions/${courseId}`)
        .set("Cookie", teacherCookie)
        .query({
          startDate: "2024-12-01",
          endDate: "2024-12-31",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Schedule with exceptions retrieved successfully"
      );
      expect(res.body.data).toBeDefined();
      expect(res.body.data.course).toBeDefined();
      expect(res.body.data.schedule).toBeDefined();
    });

    it("should fail without startDate and endDate", async () => {
      const res = await request(app)
        .get(`/schedules/exceptions/${courseId}`)
        .set("Cookie", teacherCookie);

      expect(res.status).toBe(400);
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .get(`/schedules/exceptions/${courseId}`)
        .query({
          startDate: "2024-12-01",
          endDate: "2024-12-31",
        });

      expect(res.status).toBe(401);
    });

    it("should fail with invalid courseId", async () => {
      const res = await request(app)
        .get("/schedules/exceptions/invalid-id")
        .set("Cookie", teacherCookie)
        .query({
          startDate: "2024-12-01",
          endDate: "2024-12-31",
        });

      expect(res.status).toBe(400);
    });

    it("should fail with non-existent courseId", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/schedules/exceptions/${fakeId}`)
        .set("Cookie", teacherCookie)
        .query({
          startDate: "2024-12-01",
          endDate: "2024-12-31",
        });

      expect(res.status).toBe(404);
    });
  });
});

