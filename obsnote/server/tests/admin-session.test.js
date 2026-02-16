import mongoose from "mongoose";
import { RefreshToken } from "../src/models/RefreshToken.js";
import { createRawRefreshToken, hashToken } from "../src/utils/jwt.js";
import { createTestUser, loginAs, request, app } from "./helpers/session.js";

const firstCookie = (response) => {
  const cookies = response.headers["set-cookie"] ?? [];
  const cookie = cookies[0] ?? "";
  return cookie.split(";")[0];
};

describe("admin activity and user management routes", () => {
  it("covers user listing, status updates, activity feed, and summary filters", async () => {
    const admin = await createTestUser({
      email: "ops-admin@example.com",
      role: "admin",
      password: "OpsAdminPass123!"
    });
    await createTestUser({
      email: "ops-member@example.com",
      role: "user",
      password: "OpsMemberPass123!"
    });

    const { accessToken } = await loginAs({
      email: "ops-admin@example.com",
      password: "OpsAdminPass123!"
    });
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const usersList = await request(app).get("/api/admin/users").set(authHeader);
    expect(usersList.statusCode).toBe(200);
    expect(usersList.body.users.length).toBeGreaterThanOrEqual(2);
    expect(usersList.body.users.some((user) => user.email === "ops-member@example.com")).toBe(true);
    expect(usersList.body.users.every((user) => "activityCount" in user)).toBe(true);

    const duplicateCreate = await request(app).post("/api/admin/users").set(authHeader).send({
      email: "ops-member@example.com",
      role: "user"
    });
    expect(duplicateCreate.statusCode).toBe(409);
    expect(duplicateCreate.body.error).toBe("EMAIL_TAKEN");

    const createdUser = await request(app).post("/api/admin/users").set(authHeader).send({
      email: "fresh-user@example.com",
      role: "user"
    });
    expect(createdUser.statusCode).toBe(201);

    const invalidStatusTarget = await request(app)
      .patch("/api/admin/users/not-an-id/status")
      .set(authHeader)
      .send({
        status: "disabled"
      });
    expect(invalidStatusTarget.statusCode).toBe(400);
    expect(invalidStatusTarget.body.error).toBe("VALIDATION_ERROR");

    const selfDisable = await request(app)
      .patch(`/api/admin/users/${admin._id.toString()}/status`)
      .set(authHeader)
      .send({
        status: "disabled"
      });
    expect(selfDisable.statusCode).toBe(400);
    expect(selfDisable.body.message).toContain("cannot disable");

    const missingUserId = new mongoose.Types.ObjectId().toString();
    const missingUser = await request(app)
      .patch(`/api/admin/users/${missingUserId}/status`)
      .set(authHeader)
      .send({
        status: "disabled"
      });
    expect(missingUser.statusCode).toBe(404);
    expect(missingUser.body.error).toBe("USER_NOT_FOUND");

    const disabledUser = await request(app)
      .patch(`/api/admin/users/${createdUser.body.user.id}/status`)
      .set(authHeader)
      .send({
        status: "disabled"
      });
    expect(disabledUser.statusCode).toBe(200);
    expect(disabledUser.body.user.status).toBe("disabled");

    const from = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const activity = await request(app)
      .get("/api/admin/activity")
      .set(authHeader)
      .query({
        eventType: "user.status.update",
        userId: admin._id.toString(),
        from,
        to,
        page: 1,
        limit: 20
      });
    expect(activity.statusCode).toBe(200);
    expect(Array.isArray(activity.body.events)).toBe(true);
    expect(activity.body.limit).toBe(20);

    const summary = await request(app)
      .get("/api/admin/activity/summary")
      .set(authHeader)
      .query({ from, to });
    expect(summary.statusCode).toBe(200);
    expect(summary.body.metrics).toBeDefined();
    expect(summary.body.metrics.loginSuccess).toBeGreaterThanOrEqual(1);
  });
});

describe("refresh session lifecycle", () => {
  it("rotates refresh tokens and blocks revoked or expired sessions", async () => {
    const user = await createTestUser({
      email: "session-user@example.com",
      password: "SessionPass123!"
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "session-user@example.com",
      password: "SessionPass123!"
    });
    expect(login.statusCode).toBe(200);
    const loginCookie = firstCookie(login);
    expect(loginCookie).toContain("obsnote_refresh=");

    const refresh = await request(app).post("/api/auth/refresh").set("Cookie", loginCookie).send({});
    expect(refresh.statusCode).toBe(200);
    expect(typeof refresh.body.accessToken).toBe("string");
    const rotatedCookie = firstCookie(refresh);
    expect(rotatedCookie).toContain("obsnote_refresh=");

    const logoutNoCookie = await request(app).post("/api/auth/logout").send({});
    expect(logoutNoCookie.statusCode).toBe(204);

    const logout = await request(app).post("/api/auth/logout").set("Cookie", rotatedCookie).send({});
    expect(logout.statusCode).toBe(204);

    const revoked = await request(app).post("/api/auth/refresh").set("Cookie", rotatedCookie).send({});
    expect(revoked.statusCode).toBe(401);
    expect(revoked.body.error).toBe("UNAUTHORIZED");

    const expiredRawToken = createRawRefreshToken();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(expiredRawToken),
      expiresAt: new Date(Date.now() - 30_000),
      createdByIp: "127.0.0.1",
      userAgent: "vitest"
    });

    const expired = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `obsnote_refresh=${expiredRawToken}`)
      .send({});
    expect(expired.statusCode).toBe(401);
    expect(expired.body.error).toBe("UNAUTHORIZED");
  });

  it("rejects refresh without a cookie", async () => {
    const response = await request(app).post("/api/auth/refresh").send({});
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("UNAUTHORIZED");
  });
});

