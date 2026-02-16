import { createTestUser, loginAs, request, app } from "./helpers/session.js";

describe("RBAC and admin routes", () => {
  it("rejects non-admin users from admin endpoints", async () => {
    await createTestUser({
      email: "member@example.com",
      role: "user",
      password: "MemberPass123!"
    });

    const { accessToken, response } = await loginAs({
      email: "member@example.com",
      password: "MemberPass123!"
    });
    expect(response.statusCode).toBe(200);

    const createUserAttempt = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: "new-user@example.com",
        role: "user"
      });

    expect(createUserAttempt.statusCode).toBe(403);
    expect(createUserAttempt.body.error).toBe("FORBIDDEN");

    const activityAttempt = await request(app)
      .get("/api/admin/activity")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(activityAttempt.statusCode).toBe(403);
    expect(activityAttempt.body.error).toBe("FORBIDDEN");
  });

  it("allows admin to create users with temporary passwords", async () => {
    await createTestUser({
      email: "admin@example.com",
      role: "admin",
      password: "AdminPass123!"
    });

    const { accessToken, response } = await loginAs({
      email: "admin@example.com",
      password: "AdminPass123!"
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.user.role).toBe("admin");

    const created = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: "invited@example.com",
        role: "user"
      });

    expect(created.statusCode).toBe(201);
    expect(created.body.user.email).toBe("invited@example.com");
    expect(created.body.user.mustChangePassword).toBe(true);
    expect(typeof created.body.temporaryPassword).toBe("string");
    expect(created.body.temporaryPassword.length).toBeGreaterThanOrEqual(10);
  });
});

