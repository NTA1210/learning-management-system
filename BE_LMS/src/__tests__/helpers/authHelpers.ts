import request from "supertest";
import UserModel from "@/models/user.model";
import CourseModel from "@/models/course.model";
import { Role } from "@/types";

/**
 * Helper function to register a user with optional role
 * Password will be automatically hashed by UserModel pre-save hook
 */
export async function registerUser(
  app: any,
  {
    username = "testuser",
    email = "test@example.com",
    password = "password123",
    role = Role.STUDENT,
    isVerified = true,
  }: {
    username?: string;
    email?: string;
    password?: string;
    role?: Role;
    isVerified?: boolean;
  } = {}
) {
  // Create user directly in database
  // Password will be automatically hashed by UserModel pre-save hook
  const user = await UserModel.create({
    username,
    email,
    password,
    role,
    isVerified,
  });

  return user;
}

/**
 * Helper function to login a user and get auth cookie
 */
export async function loginUser(app: any, email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.headers["set-cookie"];
}

/**
 * Helper function to create a course
 */
export async function createCourse(
  app: any,
  authCookie: string[],
  courseData: any
) {
  const res = await request(app)
    .post("/courses")
    .set("Cookie", authCookie)
    .send(courseData);
  return res.body.data;
}

/**
 * Helper function to make authenticated request
 */
export function authenticatedRequest(
  app: any,
  method: "get" | "post" | "put" | "delete",
  url: string,
  authCookie: string[]
) {
  return request(app)[method](url).set("Cookie", authCookie);
}
