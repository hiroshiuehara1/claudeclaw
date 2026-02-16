import { User } from "../src/models/User.js";
import { createTestUser, loginAs, request, app } from "./helpers/session.js";

describe("auth routes", () => {
  it("locks account after repeated failed logins", async () => {
    await createTestUser({
      email: "lock@example.com",
      password: "CorrectPass123!"
    });

    const attempt1 = await request(app).post("/api/auth/login").send({
      email: "lock@example.com",
      password: "WrongPass123!"
    });
    expect(attempt1.statusCode).toBe(401);
    expect(attempt1.body.error).toBe("INVALID_CREDENTIALS");

    const attempt2 = await request(app).post("/api/auth/login").send({
      email: "lock@example.com",
      password: "WrongPass123!"
    });
    expect(attempt2.statusCode).toBe(401);

    const attempt3 = await request(app).post("/api/auth/login").send({
      email: "lock@example.com",
      password: "WrongPass123!"
    });
    expect(attempt3.statusCode).toBe(401);

    const lockedAttempt = await request(app).post("/api/auth/login").send({
      email: "lock@example.com",
      password: "CorrectPass123!"
    });
    expect(lockedAttempt.statusCode).toBe(423);
    expect(lockedAttempt.body.error).toBe("ACCOUNT_LOCKED");

    const user = await User.findOne({ email: "lock@example.com" });
    expect(user).not.toBeNull();
    expect(user.failedLoginCount).toBe(3);
    expect(user.lockUntil).not.toBeNull();
    expect(user.lockUntil > new Date()).toBe(true);
  });

  it("enforces password reset before protected note actions", async () => {
    await createTestUser({
      email: "reset@example.com",
      password: "TempPass123!",
      mustChangePassword: true
    });

    const { accessToken, response } = await loginAs({
      email: "reset@example.com",
      password: "TempPass123!"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.mustChangePassword).toBe(true);

    const blockedCreate = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Blocked note"
      });

    expect(blockedCreate.statusCode).toBe(403);
    expect(blockedCreate.body.error).toBe("PASSWORD_RESET_REQUIRED");

    const resetResponse = await request(app)
      .post("/api/auth/force-reset-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "TempPass123!",
        newPassword: "BrandNewPass456!"
      });

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.body.user.mustChangePassword).toBe(false);

    const allowedCreate = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Allowed note",
        contentMarkdown: "Now allowed"
      });

    expect(allowedCreate.statusCode).toBe(201);
    expect(allowedCreate.body.note.title).toBe("Allowed note");
  });
});

