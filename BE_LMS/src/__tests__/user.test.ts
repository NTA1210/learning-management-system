// tests/auth.test.ts
import request from "supertest";
import { createApp } from "@/app";
import VerificationCodeModel from "@/models/verificationCode.model";
import VerificationCodeType from "@/constants/verificationCode";
import UserModel from "@/models/user.model";

// Mock sendMail
jest.mock("../utils/sendMail", () => ({
  sendMail: jest.fn().mockResolvedValue({ data: { id: "12345678" } }),
}));

const app = createApp();

describe("🔐 Auth API Integration Tests", () => {
  const email = "user12345@gmail.com";
  const password = "12345678";

  // -------------------
  // Register
  // -------------------
  describe("POST /auth/register", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/auth/register").send({
        username: "user12345",
        email,
        password,
        confirmPassword: password,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(email);
    });

    it("should fail when passwords do not match", async () => {
      const res = await request(app).post("/auth/register").send({
        username: "user12345",
        email,
        password,
        confirmPassword: "wrong",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------
  // Verify Email
  // -------------------
  describe("GET /auth/email/verify/:code", () => {
    it("should verify email code format", async () => {
      const userRes = await request(app).post("/auth/register").send({
        username: "verifyUser",
        email: "verify@gmail.com",
        password: "12345678",
        confirmPassword: "12345678",
      });

      const code = (await VerificationCodeModel.findOne({
        userId: userRes.body.data._id,
        type: VerificationCodeType.VERIFY_EMAIL,
      })) as any;

      const res = await request(app).get(
        `/auth/email/verify/${code._id.toString()}`
      );
      expect(res.status).toBe(200);
    });
  });

  // -------------------
  // Login
  // -------------------
  describe("POST /auth/login", () => {
    it("should login successfully", async () => {
      await request(app).post("/auth/register").send({
        username: "userlogin",
        email,
        password,
        confirmPassword: password,
      });
      await UserModel.findOneAndUpdate(
        { email },
        { verified: true },
        { new: true }
      );

      const res = await request(app).post("/auth/login").send({
        email,
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should fail when password invalid", async () => {
      const res = await request(app).post("/auth/login").send({
        email,
        password: "wrong",
      });
      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // Refresh Token
  // -------------------
  describe("GET /auth/refresh", () => {
    it("should fail when no token", async () => {
      const res = await request(app).get("/auth/refresh");
      expect(res.status).toBe(401);
    });
  });

  // -------------------
  // Forgot Password
  // -------------------
  describe("POST /auth/password/forgot", () => {
    it("should send forgot password mail", async () => {
      await request(app).post("/auth/register").send({
        username: "userlogin",
        email,
        password,
        confirmPassword: password,
      });

      const res = await request(app).post("/auth/password/forgot").send({
        email,
      });
      console.log(res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // -------------------
  // Reset Password
  // -------------------
  describe("POST /auth/password/reset", () => {
    it("should reset password", async () => {
      await request(app).post("/auth/register").send({
        username: "userlogin",
        email,
        password,
        confirmPassword: password,
      });

      await request(app).post("/auth/password/forgot").send({
        email,
      });

      const code = (await VerificationCodeModel.findOne({
        email,
        type: VerificationCodeType.FORGOT_PASSWORD,
      })) as any;

      const res = await request(app).post("/auth/password/reset").send({
        verificationCode: code._id.toString(),
        password: "12345678",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
