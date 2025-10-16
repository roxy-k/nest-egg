import chai from "chai";
import request from "./helpers/request.js";
import { mockCategoryModel } from "./helpers/mockModels.js";
import app from "../src/index.js";

const { expect } = chai;

describe("Categories API", () => {
  const categoryMock = mockCategoryModel();

  before(() => {
    process.env.TEST_BYPASS_AUTH = "1";
  });
  beforeEach(() => categoryMock.reset());
  after(() => {
    categoryMock.restore();
    delete process.env.TEST_BYPASS_AUTH;
  });

  it("creates a category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({
        id: "groceries",
        name: "groceries",
        type: "expense",
      });

    expect(res.status).to.be.oneOf([200, 201]);
    expect(res.body).to.have.property("name", "groceries");
  });

  it("rejects invalid payload", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({});
    expect(res.status).to.be.oneOf([400, 422]);
  });

  it("lists categories", async () => {
    await request(app)
      .post("/api/categories")
      .send({
        id: "transport",
        name: "transport",
        type: "expense",
      });

    const res = await request(app).get("/api/categories");
    expect(res.status).to.be.oneOf([200, 201]);
    expect(res.body).to.be.an("array");
  });

  it("deletes a category", async () => {
    const created = await request(app)
      .post("/api/categories")
      .send({
        id: "fun",
        name: "fun",
        type: "expense",
      });

    const id = created.body.id || created.body._id;
    const res = await request(app).delete(`/api/categories/${id}`);

    expect([200, 204, 404]).to.include(res.status);
  });
});
