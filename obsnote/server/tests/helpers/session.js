import request from "supertest";
import app from "../../src/app.js";
import { User } from "../../src/models/User.js";
import { hashPassword } from "../../src/utils/password.js";

export const createTestUser = async ({
  email,
  password = "Password123!",
  role = "user",
  status = "active",
  mustChangePassword = false
}) => {
  const passwordHash = await hashPassword(password);
  return User.create({
    email: email.toLowerCase(),
    passwordHash,
    role,
    status,
    mustChangePassword
  });
};

export const loginAs = async ({ email, password = "Password123!" }) => {
  const response = await request(app).post("/api/auth/login").send({
    email,
    password
  });

  return {
    response,
    accessToken: response.body?.accessToken,
    user: response.body?.user,
    cookies: response.headers["set-cookie"] ?? []
  };
};

export { app, request };

