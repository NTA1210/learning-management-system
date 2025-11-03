// tests/specialist.test.ts
import request from "supertest";
import { createApp } from "@/app";
import SpecialistModel from "@/models/specialist.model";
import MajorModel from "@/models/major.model";
import { loginUser } from "./helpers/loginUser";

const app = createApp();

describe("🎓 Specialist API Integration Tests", () => {
  let majorId: string;
  let adminCookie: any;
  const adminEmail = "admin1@example.com";
  const adminPassword = "123456";

  // Setup: Create a major and login with existing admin before all tests
  beforeAll(async () => {
    // Create a major for testing
    const major = await MajorModel.create({
      name: "Computer Science Test",
      description: "Test major for specialist tests",
    });
    majorId = major._id.toString();

    // Login with existing admin account
    adminCookie = await loginUser(app, adminEmail, adminPassword);
  });

  // -------------------
  // List Specialists (Public)
  // -------------------
  describe("GET /specialists", () => {
    it("should list all specialists with pagination", async () => {
      const res = await request(app).get("/specialists").query({
        page: 1,
        limit: 10,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Specialists retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    it("should filter specialists by majorId", async () => {
      const res = await request(app).get("/specialists").query({
        majorId: majorId,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should search specialists by name", async () => {
      const res = await request(app).get("/specialists").query({
        search: "test",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  // -------------------
  // Create Specialist (Protected - Admin only)
  // -------------------
  describe("POST /specialists", () => {
    it("should create a new specialist as admin", async () => {
      const res = await request(app)
        .post("/specialists")
        .set("Cookie", adminCookie)
        .send({
          name: "Software Engineering",
          description: "Focus on software development and engineering practices",
          majorId: majorId,
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Specialist created successfully");
      expect(res.body.data.name).toBe("Software Engineering");
      expect(res.body.data.slug).toBe("software-engineering");
      expect(res.body.data.majorId.toString()).toBe(majorId);
    });

    it("should fail to create specialist without authentication", async () => {
      const res = await request(app).post("/specialists").send({
        name: "Data Science",
        majorId: majorId,
      });

      expect(res.status).toBe(401);
    });

    it("should fail to create specialist with duplicate name", async () => {
      await request(app)
        .post("/specialists")
        .set("Cookie", adminCookie)
        .send({
          name: "Artificial Intelligence",
          majorId: majorId,
        });

      const res = await request(app)
        .post("/specialists")
        .set("Cookie", adminCookie)
        .send({
          name: "Artificial Intelligence",
          majorId: majorId,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already exists");
    });

    it("should fail to create specialist without required fields", async () => {
      const res = await request(app)
        .post("/specialists")
        .set("Cookie", adminCookie)
        .send({
          description: "Missing name and majorId",
        });

      expect(res.status).toBe(400);
    });

    it("should fail to create specialist with invalid majorId", async () => {
      const res = await request(app)
        .post("/specialists")
        .set("Cookie", adminCookie)
        .send({
          name: "Invalid Major Test",
          majorId: "invalid-id",
        });

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Get Specialist by ID (Public)
  // -------------------
  describe("GET /specialists/id/:id", () => {
    it("should get specialist by ID", async () => {
      const specialist = await SpecialistModel.create({
        name: "Cybersecurity Test",
        description: "Security testing specialist",
        majorId: majorId,
      });

      const res = await request(app).get(`/specialists/id/${specialist._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Specialist retrieved successfully");
      expect(res.body.data.name).toBe("Cybersecurity Test");
    });

    it("should return 404 for non-existent specialist ID", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app).get(`/specialists/id/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Get Specialist by Slug (Public)
  // -------------------
  describe("GET /specialists/:slug", () => {
    it("should get specialist by slug", async () => {
      const specialist = await SpecialistModel.create({
        name: "Machine Learning Test",
        description: "ML specialist",
        majorId: majorId,
      });

      const res = await request(app).get(`/specialists/${specialist.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Specialist retrieved successfully");
      expect(res.body.data.slug).toBe(specialist.slug);
    });

    it("should return 404 for non-existent slug", async () => {
      const res = await request(app).get("/specialists/non-existent-slug-xyz");

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Update Specialist by ID (Protected - Admin only)
  // -------------------
  describe("PATCH /specialists/id/:id", () => {
    it("should update specialist by ID as admin", async () => {
      const specialist = await SpecialistModel.create({
        name: "Cloud Computing Test",
        majorId: majorId,
      });

      const res = await request(app)
        .patch(`/specialists/id/${specialist._id}`)
        .set("Cookie", adminCookie)
        .send({
          description: "Updated cloud computing description",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Specialist updated successfully");
      expect(res.body.data.description).toBe(
        "Updated cloud computing description"
      );
    });

    it("should fail to update without authentication", async () => {
      const specialist = await SpecialistModel.create({
        name: "DevOps Test",
        majorId: majorId,
      });

      const res = await request(app)
        .patch(`/specialists/id/${specialist._id}`)
        .send({
          description: "Should fail",
        });

      expect(res.status).toBe(401);
    });

    it("should return 404 when updating non-existent specialist", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .patch(`/specialists/id/${fakeId}`)
        .set("Cookie", adminCookie)
        .send({
          description: "Update non-existent",
        });

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Update Specialist by Slug (Protected - Admin only)
  // -------------------
  describe("PATCH /specialists/:slug", () => {
    it("should update specialist by slug as admin", async () => {
      const specialist = await SpecialistModel.create({
        name: "Blockchain Test",
        majorId: majorId,
      });

      const res = await request(app)
        .patch(`/specialists/${specialist.slug}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Blockchain Technology",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Specialist updated successfully");
      expect(res.body.data.name).toBe("Blockchain Technology");
    });

    it("should fail to update with duplicate name", async () => {
      await SpecialistModel.create({
        name: "IoT Specialist",
        majorId: majorId,
      });

      const specialist2 = await SpecialistModel.create({
        name: "Embedded Systems",
        majorId: majorId,
      });

      const res = await request(app)
        .patch(`/specialists/${specialist2.slug}`)
        .set("Cookie", adminCookie)
        .send({
          name: "IoT Specialist",
        });

      expect(res.status).toBe(409);
    });
  });

  // -------------------
  // Delete Specialist by ID (Protected - Admin only)
  // -------------------
  describe("DELETE /specialists/id/:id", () => {
    it("should delete specialist by ID as admin", async () => {
      const specialist = await SpecialistModel.create({
        name: "Quantum Computing Test",
        majorId: majorId,
      });

      const res = await request(app)
        .delete(`/specialists/id/${specialist._id}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Specialist deleted successfully");

      // Verify deletion
      const deleted = await SpecialistModel.findById(specialist._id);
      expect(deleted).toBeNull();
    });

    it("should fail to delete without authentication", async () => {
      const specialist = await SpecialistModel.create({
        name: "AR/VR Test",
        majorId: majorId,
      });

      const res = await request(app).delete(
        `/specialists/id/${specialist._id}`
      );

      expect(res.status).toBe(401);
    });

    it("should return 404 when deleting non-existent specialist", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .delete(`/specialists/id/${fakeId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Delete Specialist by Slug (Protected - Admin only)
  // -------------------
  describe("DELETE /specialists/:slug", () => {
    it("should delete specialist by slug as admin", async () => {
      const specialist = await SpecialistModel.create({
        name: "Robotics Test",
        majorId: majorId,
      });

      const res = await request(app)
        .delete(`/specialists/${specialist.slug}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Specialist deleted successfully");
    });

    it("should return 404 when deleting non-existent slug", async () => {
      const res = await request(app)
        .delete("/specialists/non-existent-slug-xyz")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });
  });
});

