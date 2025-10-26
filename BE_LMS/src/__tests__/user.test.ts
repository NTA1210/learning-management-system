// tests/auth.test.ts
import request from "supertest";

jest.mock("@/utils/sendMail", () => ({
  sendMail: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/services/auth.service.ts", () => ({
  createAccount: jest.fn().mockResolvedValue({
    user: {
      username: "user12345",
      email: "user12345@gmal.com",
    },
  }),
  verifyEmail: jest.fn().mockResolvedValue(true),
  loginUser: jest.fn().mockResolvedValue({
    accessToken: "accessToken",
    refreshToken: "refreshToken",
  }),
  refreshUserAccessToken: jest.fn().mockResolvedValue({
    accessToken: "accessToken",
    refreshToken: "refreshToken",
  }),
  resetPassword: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

import { createApp } from "../app";
import mongoose from "mongoose";
const app = createApp();

describe("Auth API", () => {
  const email = "user12345@gmal.com";
  const password = "1231234";

  // -------------------
  // Register
  // -------------------
  describe("POST /auth/register", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/auth/register").send({
        username: "user12345",
        email,
        password: password,
        confirmPassword: password,
      });

      // Kiểm tra status và success
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(email);
    });

    it("should fail when passwords do not match", async () => {
      const res = await request(app).post("/auth/register").send({
        username: "admin",
        email,
        password,
        confirmPassword: "wrong",
      });

      // Controller sẽ validate password != confirmPassword
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------
  // Verify Email
  // -------------------
  describe("GET /auth/email/verify/:code", () => {
    it("should verify email independently", async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/auth/email/verify/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // -------------------
  // Login
  // -------------------
  describe("POST /auth/login", () => {
    it("should login and set token cookie", async () => {
      const res = await request(app).post("/auth/login").send({
        email,
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers["set-cookie"] as unknown as string[];
      expect(cookies.length).toBe(2);
    });

    it("should fail login with invalid password", async () => {
      const res = await request(app).post("/auth/login").send({
        email,
        password: "wrong",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------
  // Logout
  // -------------------

  describe("GET /auth/logout", () => {
    it("should logout and clear token cookie", async () => {
      const res = await request(app).get("/auth/logout");

      expect(res.status).toBe(200);

      const tokens = res.headers["set-cookie"] as unknown as string[];
      const accessTokenCookie = tokens.find((cookie) =>
        cookie.startsWith("accessToken=")
      );
      const refreshTokenCookie = tokens.find((cookie) =>
        cookie.startsWith("refreshToken=")
      );
      expect(accessTokenCookie).toMatch(
        /Expires=Thu, 01 Jan 1970 00:00:00 GMT/
      );
      expect(refreshTokenCookie).toMatch(
        /Expires=Thu, 01 Jan 1970 00:00:00 GMT/
      );
    });
  });

  // -------------------
  // Refresh
  // -------------------
  describe("GET /auth/refresh", () => {
    it("should refresh token", async () => {
      // login lấy cookie
      const login = await request(app).post("/auth/login").send({
        email,
        password,
      });

      const cookies = login.headers["set-cookie"] as unknown as string[];

      expect(cookies.length).toBe(2);
      const refreshTokenCookie = cookies.find((c) =>
        c.startsWith("refreshToken=")
      );
      const accessTokenCookie = cookies.find((c) =>
        c.startsWith("accessToken=")
      );

      if (!refreshTokenCookie || !accessTokenCookie)
        throw new Error("Tokens not found");

      const oldAccessToken = accessTokenCookie.split("=")[1].split(";")[0];

      // // gọi /refresh
      const res = await request(app)
        .get("/auth/refresh")
        .set("Cookie", [refreshTokenCookie]);
      console.log(res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when refresh token is not given", async () => {
      const res = await request(app).get("/auth/refresh");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------
  // Forgot Password
  // -------------------
  describe("POST /auth/reset-password", () => {
    it("should reset when email is valid", async () => {
      const res = await request(app).post("/auth/password/forgot").send({
        email,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when email is invalid", async () => {
      const res = await request(app).post("/auth/password/forgot").send({
        email: "wrong",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------
  // Reset Password
  // -------------------
  describe("POST /auth/reset-password", () => {
    it("should reset password", async () => {
      const res = await request(app).post("/auth/password/reset").send({
        verificationCode: new mongoose.Types.ObjectId().toString(),
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when verification code is invalid", async () => {
      const res = await request(app).post("/auth/password/reset").send({
        verificationCode: "12345",
        password,
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
