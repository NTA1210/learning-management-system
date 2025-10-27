import request from "supertest";

export async function loginUser(app: any, email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.headers["set-cookie"];
}
