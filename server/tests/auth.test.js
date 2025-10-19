import chai from "chai";
import bcrypt from "bcryptjs";
import request from "./helpers/request.js";
import { mockUserModel } from "./helpers/mockModels.js";
import app from "../src/index.js";
import User from "../src/models/User.js";

const { expect } = chai;

describe("Auth API", () => {
  const userMock = mockUserModel();

  before(() => {
    process.env.TEST_BYPASS_AUTH = "1";
  });

  beforeEach(() => {
    userMock.reset();
  });

  after(() => {
    userMock.restore();
    delete process.env.TEST_BYPASS_AUTH;
  });

  it("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "secret123", name: "New User" });

    expect(res.status).to.equal(201);
    expect(res.body.user).to.include({ email: "new@example.com" });
    expect(res.body).to.have.property("token").that.is.a("string");
    expect(userMock.store).to.have.length(1);
  });

  it("prevents duplicate registration", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "secret123", name: "Dup" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "secret456", name: "Dup 2" });

    expect(res.status).to.equal(409);
  });

  it("logs in an existing user", async () => {
    const passwordHash = await bcrypt.hash("secret123", 12);
    await User.create({ email: "login@example.com", passwordHash, name: "Login Test" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "secret123" });

    expect(res.status).to.equal(200);
    expect(res.body.user).to.include({ email: "login@example.com" });
    expect(res.body).to.have.property("token");
  });

  it("rejects invalid credentials", async () => {
    const passwordHash = await bcrypt.hash("secret123", 12);
    await User.create({ email: "invalid@example.com", passwordHash, name: "Invalid" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "invalid@example.com", password: "wrongpass" });

    expect(res.status).to.equal(401);
  });

  it("changes password for the authenticated user", async () => {
    const passwordHash = await bcrypt.hash("old-pass-1", 12);
    await User.create({
      _id: "test-user-id",
      email: "change@example.com",
      passwordHash,
      name: "Changer",
    });

    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ currentPassword: "old-pass-1", newPassword: "new-pass-1" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("ok", true);

    const updated = userMock.store.find((doc) => doc.email === "change@example.com");
    const stillOld = await bcrypt.compare("old-pass-1", updated.passwordHash);
    const nowNew = await bcrypt.compare("new-pass-1", updated.passwordHash);
    expect(stillOld).to.be.false;
    expect(nowNew).to.be.true;
  });

  it("handles password reset flow end-to-end", async () => {
    const passwordHash = await bcrypt.hash("old-reset", 12);
    await User.create({ email: "reset@example.com", passwordHash, name: "Resetter" });

    const requestRes = await request(app)
      .post("/api/auth/request-reset")
      .send({ email: "reset@example.com" });

    expect(requestRes.status).to.equal(200);
    expect(requestRes.body).to.include({ ok: true });
    expect(requestRes.body).to.have.property("token").that.is.a("string");

    const invalidAttempt = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "reset@example.com", token: "bad-token", newPassword: "new-reset-1" });
    expect(invalidAttempt.status).to.equal(400);

    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        email: "reset@example.com",
        token: requestRes.body.token,
        newPassword: "new-reset-1",
      });

    expect(resetRes.status).to.equal(200);
    expect(resetRes.body).to.include({ ok: true });

    const updated = userMock.store.find((doc) => doc.email === "reset@example.com");
    const matches = await bcrypt.compare("new-reset-1", updated.passwordHash);
    expect(matches).to.be.true;
    expect(updated.passwordResetTokenHash).to.equal("");
    expect(updated.passwordResetExpiresAt).to.equal(null);
  });
});
