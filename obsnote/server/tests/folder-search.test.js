import mongoose from "mongoose";
import { Note } from "../src/models/Note.js";
import { createTestUser, loginAs, request, app } from "./helpers/session.js";

describe("folder routes", () => {
  it("supports create/update/delete flows with validation and non-empty guards", async () => {
    await createTestUser({
      email: "folders@example.com",
      password: "FolderPass123!"
    });

    const { accessToken } = await loginAs({
      email: "folders@example.com",
      password: "FolderPass123!"
    });

    const authHeader = { Authorization: `Bearer ${accessToken}` };
    const missingId = new mongoose.Types.ObjectId().toString();

    const initialList = await request(app).get("/api/folders").set(authHeader);
    expect(initialList.statusCode).toBe(200);
    expect(initialList.body.folders).toHaveLength(0);

    const rootCreated = await request(app).post("/api/folders").set(authHeader).send({
      name: "Root"
    });
    expect(rootCreated.statusCode).toBe(201);
    expect(rootCreated.body.folder.pathCache).toBe("root");
    const rootId = rootCreated.body.folder._id;

    const badParent = await request(app).post("/api/folders").set(authHeader).send({
      name: "Invalid",
      parentFolderId: "not-an-id"
    });
    expect(badParent.statusCode).toBe(400);
    expect(badParent.body.error).toBe("VALIDATION_ERROR");

    const childCreated = await request(app).post("/api/folders").set(authHeader).send({
      name: "Child",
      parentFolderId: rootId
    });
    expect(childCreated.statusCode).toBe(201);
    expect(childCreated.body.folder.pathCache).toBe("root/child");
    const childId = childCreated.body.folder._id;

    const patchInvalidId = await request(app).patch("/api/folders/not-an-id").set(authHeader).send({
      name: "Ignored"
    });
    expect(patchInvalidId.statusCode).toBe(400);

    const patchMissingId = await request(app)
      .patch(`/api/folders/${missingId}`)
      .set(authHeader)
      .send({
        name: "Ignored"
      });
    expect(patchMissingId.statusCode).toBe(404);

    const selfParent = await request(app).patch(`/api/folders/${rootId}`).set(authHeader).send({
      parentFolderId: rootId
    });
    expect(selfParent.statusCode).toBe(400);
    expect(selfParent.body.error).toBe("VALIDATION_ERROR");

    const invalidParent = await request(app).patch(`/api/folders/${rootId}`).set(authHeader).send({
      parentFolderId: "bad-parent"
    });
    expect(invalidParent.statusCode).toBe(400);

    const missingParent = await request(app).patch(`/api/folders/${rootId}`).set(authHeader).send({
      parentFolderId: missingId
    });
    expect(missingParent.statusCode).toBe(404);

    const renamed = await request(app).patch(`/api/folders/${rootId}`).set(authHeader).send({
      name: "Projects"
    });
    expect(renamed.statusCode).toBe(200);
    expect(renamed.body.folder.pathCache).toBe("projects");

    const deleteInvalid = await request(app).delete("/api/folders/not-an-id").set(authHeader);
    expect(deleteInvalid.statusCode).toBe(400);

    const deleteMissing = await request(app).delete(`/api/folders/${missingId}`).set(authHeader);
    expect(deleteMissing.statusCode).toBe(404);

    const deleteParentBlockedByChild = await request(app)
      .delete(`/api/folders/${rootId}`)
      .set(authHeader);
    expect(deleteParentBlockedByChild.statusCode).toBe(409);
    expect(deleteParentBlockedByChild.body.error).toBe("FOLDER_NOT_EMPTY");

    const noteInChild = await request(app).post("/api/notes").set(authHeader).send({
      title: "Folder note",
      folderId: childId,
      contentMarkdown: "inside child"
    });
    expect(noteInChild.statusCode).toBe(201);

    const deleteChildBlockedByNote = await request(app)
      .delete(`/api/folders/${childId}`)
      .set(authHeader);
    expect(deleteChildBlockedByNote.statusCode).toBe(409);

    const noteDeleted = await request(app)
      .delete(`/api/notes/${noteInChild.body.note._id}`)
      .set(authHeader);
    expect(noteDeleted.statusCode).toBe(204);

    const childDeleted = await request(app).delete(`/api/folders/${childId}`).set(authHeader);
    expect(childDeleted.statusCode).toBe(204);

    const rootDeleted = await request(app).delete(`/api/folders/${rootId}`).set(authHeader);
    expect(rootDeleted.statusCode).toBe(204);
  });
});

describe("search routes", () => {
  it("returns empty array for empty query and matches notes by query text", async () => {
    await createTestUser({
      email: "search@example.com",
      password: "SearchPass123!"
    });

    const { accessToken } = await loginAs({
      email: "search@example.com",
      password: "SearchPass123!"
    });
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    await request(app).post("/api/notes").set(authHeader).send({
      title: "Release Notes",
      contentMarkdown: "alpha beta gamma"
    });
    await request(app).post("/api/notes").set(authHeader).send({
      title: "Shopping list",
      contentMarkdown: "bread milk eggs"
    });

    const emptyQuery = await request(app).get("/api/search?q=").set(authHeader);
    expect(emptyQuery.statusCode).toBe(200);
    expect(emptyQuery.body.notes).toEqual([]);

    const searchResults = await request(app).get("/api/search?q=alpha").set(authHeader);
    expect(searchResults.statusCode).toBe(200);
    expect(searchResults.body.notes.length).toBeGreaterThan(0);
    expect(searchResults.body.notes.some((note) => note.title === "Release Notes")).toBe(true);
  });

  it("falls back to regex search when text search throws", async () => {
    await createTestUser({
      email: "search-fallback@example.com",
      password: "FallbackPass123!"
    });

    const { accessToken } = await loginAs({
      email: "search-fallback@example.com",
      password: "FallbackPass123!"
    });
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    await request(app).post("/api/notes").set(authHeader).send({
      title: "Regex test note",
      contentMarkdown: "Contains unique phrase"
    });

    const originalFind = Note.find.bind(Note);
    let findCallCount = 0;
    const findSpy = vi.spyOn(Note, "find").mockImplementation((...args) => {
      findCallCount += 1;
      if (findCallCount === 1) {
        throw new Error("forced text search failure");
      }
      return originalFind(...args);
    });

    try {
      const response = await request(app).get("/api/search?q=unique").set(authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.notes.length).toBeGreaterThan(0);
      expect(findCallCount).toBeGreaterThanOrEqual(2);
    } finally {
      findSpy.mockRestore();
    }
  });
});

