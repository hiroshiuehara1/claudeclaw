import { Note } from "../src/models/Note.js";
import { createTestUser, loginAs, request, app } from "./helpers/session.js";

describe("notes and version history", () => {
  it("retains only the latest 10 versions and restores selected content", async () => {
    await createTestUser({
      email: "writer@example.com",
      password: "WriterPass123!"
    });

    const { accessToken } = await loginAs({
      email: "writer@example.com",
      password: "WriterPass123!"
    });

    const create = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Versioned note",
        contentMarkdown: "v1"
      });

    expect(create.statusCode).toBe(201);
    const noteId = create.body.note._id;

    for (let i = 2; i <= 12; i += 1) {
      const update = await request(app)
        .patch(`/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          contentMarkdown: `v${i}`
        });
      expect(update.statusCode).toBe(200);
    }

    const versionsResponse = await request(app)
      .get(`/api/notes/${noteId}/versions`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(versionsResponse.statusCode).toBe(200);
    const versions = versionsResponse.body.versions;
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBe(10);
    expect(versions[0].contentMarkdown).toBe("v11");
    expect(versions[versions.length - 1].contentMarkdown).toBe("v2");

    const restoreTarget = versions[versions.length - 1];
    const restoreResponse = await request(app)
      .post(`/api/notes/${noteId}/restore/${restoreTarget._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(restoreResponse.statusCode).toBe(200);
    expect(restoreResponse.body.note.contentMarkdown).toBe("v2");

    const note = await Note.findById(noteId);
    expect(note.contentMarkdown).toBe("v2");

    const versionsAfterRestore = await request(app)
      .get(`/api/notes/${noteId}/versions`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(versionsAfterRestore.statusCode).toBe(200);
    expect(versionsAfterRestore.body.versions.length).toBe(10);
  });

  it("prevents users from accessing other users' notes", async () => {
    await createTestUser({
      email: "owner@example.com",
      password: "OwnerPass123!"
    });
    await createTestUser({
      email: "intruder@example.com",
      password: "IntruderPass123!"
    });

    const ownerSession = await loginAs({
      email: "owner@example.com",
      password: "OwnerPass123!"
    });
    const intruderSession = await loginAs({
      email: "intruder@example.com",
      password: "IntruderPass123!"
    });

    const noteCreated = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${ownerSession.accessToken}`)
      .send({
        title: "Private note",
        contentMarkdown: "secret"
      });

    expect(noteCreated.statusCode).toBe(201);
    const noteId = noteCreated.body.note._id;

    const accessAttempt = await request(app)
      .get(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${intruderSession.accessToken}`);

    expect(accessAttempt.statusCode).toBe(404);
    expect(accessAttempt.body.error).toBe("NOTE_NOT_FOUND");
  });
});

