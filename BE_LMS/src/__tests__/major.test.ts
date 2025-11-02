// tests/major.test.ts
import request from "supertest";
import { createApp } from "@/app";
import MajorModel from "@/models/major.model";
import { loginUser } from "./helpers/loginUser";

const app = createApp();

describe("🎓 Major API Integration Tests", () => {
  let adminCookie: any;
  const adminEmail = "admin1@example.com";
  const adminPassword = "123456";

  // Setup: Login with existing admin before all tests
  beforeAll(async () => {
    // Login with existing admin account
    adminCookie = await loginUser(app, adminEmail, adminPassword);
  });

  // -------------------
  // List Majors (Public)
  // -------------------
  describe("GET /majors", () => {
    it("should list all majors with pagination", async () => {
      const res = await request(app).get("/majors").query({
        page: 1,
        limit: 10,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Majors retrieved successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    it("should search majors by name", async () => {
      const res = await request(app).get("/majors").query({
        search: "Computer",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should filter majors by name", async () => {
      const res = await request(app).get("/majors").query({
        name: "Computer Science",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should sort majors by createdAt", async () => {
      const res = await request(app).get("/majors").query({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  // -------------------
  // Create Major (Protected - Admin only)
  // -------------------
  describe("POST /majors", () => {
    it("should create a new major as admin", async () => {
      const res = await request(app)
        .post("/majors")
        .set("Cookie", adminCookie)
        .send({
          name: "Data Science",
          description: "Focus on data analysis, machine learning, and statistics",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Major created successfully");
      expect(res.body.data.name).toBe("Data Science");
      expect(res.body.data.slug).toBe("data-science");
      expect(res.body.data.description).toBe(
        "Focus on data analysis, machine learning, and statistics"
      );
    });

    it("should fail to create major without authentication", async () => {
      const res = await request(app).post("/majors").send({
        name: "Information Technology",
      });

      expect(res.status).toBe(401);
    });

    it("should fail to create major with duplicate name", async () => {
      await request(app)
        .post("/majors")
        .set("Cookie", adminCookie)
        .send({
          name: "Artificial Intelligence",
          description: "AI and machine learning focus",
        });

      const res = await request(app)
        .post("/majors")
        .set("Cookie", adminCookie)
        .send({
          name: "Artificial Intelligence",
          description: "Another AI major",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already exists");
    });

    it("should fail to create major without required fields", async () => {
      const res = await request(app)
        .post("/majors")
        .set("Cookie", adminCookie)
        .send({
          description: "Missing name field",
        });

      expect(res.status).toBe(400);
    });

    it("should create major with only name (description optional)", async () => {
      const res = await request(app)
        .post("/majors")
        .set("Cookie", adminCookie)
        .send({
          name: "Software Engineering Major",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Software Engineering Major");
      expect(res.body.data.slug).toBe("software-engineering-major");
    });
  });

  // -------------------
  // Get Major by ID (Public)
  // -------------------
  describe("GET /majors/id/:id", () => {
    it("should get major by ID", async () => {
      const major = await MajorModel.create({
        name: "Cybersecurity Major",
        description: "Focus on network security and ethical hacking",
      });

      const res = await request(app).get(`/majors/id/${major._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Major retrieved successfully");
      expect(res.body.data.name).toBe("Cybersecurity Major");
      expect(res.body.data._id).toBe(major._id.toString());
    });

    it("should return 404 for non-existent major ID", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app).get(`/majors/id/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid major ID format", async () => {
      const res = await request(app).get("/majors/id/invalid-id-format");

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Get Major by Slug (Public)
  // -------------------
  describe("GET /majors/:slug", () => {
    it("should get major by slug", async () => {
      const major = await MajorModel.create({
        name: "Business Administration Test",
        description: "Business and management focus",
      });

      const res = await request(app).get(`/majors/${major.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Major retrieved successfully");
      expect(res.body.data.slug).toBe(major.slug);
      expect(res.body.data.name).toBe("Business Administration Test");
    });

    it("should return 404 for non-existent slug", async () => {
      const res = await request(app).get("/majors/non-existent-slug-xyz-123");

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Update Major by ID (Protected - Admin only)
  // -------------------
  describe("PATCH /majors/id/:id", () => {
    it("should update major by ID as admin", async () => {
      const major = await MajorModel.create({
        name: "Mathematics Major",
        description: "Pure and applied mathematics",
      });

      const res = await request(app)
        .patch(`/majors/id/${major._id}`)
        .set("Cookie", adminCookie)
        .send({
          description: "Advanced mathematics and theoretical studies",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Major updated successfully");
      expect(res.body.data.description).toBe(
        "Advanced mathematics and theoretical studies"
      );
      expect(res.body.data.name).toBe("Mathematics Major");
    });

    it("should update major name and auto-generate new slug", async () => {
      const major = await MajorModel.create({
        name: "Physics Major",
      });

      const res = await request(app)
        .patch(`/majors/id/${major._id}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Applied Physics",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Applied Physics");
      expect(res.body.data.slug).toBe("applied-physics");
    });

    it("should fail to update without authentication", async () => {
      const major = await MajorModel.create({
        name: "Chemistry Major",
      });

      const res = await request(app).patch(`/majors/id/${major._id}`).send({
        description: "Should fail",
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 when updating non-existent major", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .patch(`/majors/id/${fakeId}`)
        .set("Cookie", adminCookie)
        .send({
          description: "Update non-existent",
        });

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Update Major by Slug (Protected - Admin only)
  // -------------------
  describe("PATCH /majors/:slug", () => {
    it("should update major by slug as admin", async () => {
      const major = await MajorModel.create({
        name: "Biology Major",
        description: "Life sciences study",
      });

      const res = await request(app)
        .patch(`/majors/${major.slug}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Biotechnology",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Major updated successfully");
      expect(res.body.data.name).toBe("Biotechnology");
      expect(res.body.data.slug).toBe("biotechnology");
    });

    it("should fail to update with duplicate name", async () => {
      await MajorModel.create({
        name: "Mechanical Engineering",
      });

      const major2 = await MajorModel.create({
        name: "Electrical Engineering",
      });

      const res = await request(app)
        .patch(`/majors/${major2.slug}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Mechanical Engineering",
        });

      expect(res.status).toBe(409);
    });

    it("should return 404 for non-existent slug", async () => {
      const res = await request(app)
        .patch("/majors/non-existent-slug-xyz")
        .set("Cookie", adminCookie)
        .send({
          description: "Update non-existent",
        });

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Delete Major by ID (Protected - Admin only)
  // -------------------
  describe("DELETE /majors/id/:id", () => {
    it("should delete major by ID as admin", async () => {
      const major = await MajorModel.create({
        name: "Environmental Science Major",
        description: "Study of environmental systems",
      });

      const res = await request(app)
        .delete(`/majors/id/${major._id}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Major deleted successfully");

      // Verify deletion
      const deleted = await MajorModel.findById(major._id);
      expect(deleted).toBeNull();
    });

    it("should fail to delete without authentication", async () => {
      const major = await MajorModel.create({
        name: "Geology Major",
      });

      const res = await request(app).delete(`/majors/id/${major._id}`);

      expect(res.status).toBe(401);
    });

    it("should return 404 when deleting non-existent major", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .delete(`/majors/id/${fakeId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });
  });

  // -------------------
  // Delete Major by Slug (Protected - Admin only)
  // -------------------
  describe("DELETE /majors/:slug", () => {
    it("should delete major by slug as admin", async () => {
      const major = await MajorModel.create({
        name: "Architecture Major",
        description: "Building design and construction",
      });

      const res = await request(app)
        .delete(`/majors/${major.slug}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Major deleted successfully");

      // Verify deletion
      const deleted = await MajorModel.findOne({ slug: major.slug });
      expect(deleted).toBeNull();
    });

    it("should fail to delete without authentication", async () => {
      const major = await MajorModel.create({
        name: "Psychology Major",
      });

      const res = await request(app).delete(`/majors/${major.slug}`);

      expect(res.status).toBe(401);
    });

    it("should return 404 when deleting non-existent slug", async () => {
      const res = await request(app)
        .delete("/majors/non-existent-slug-xyz")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });
  });
});

