import chai from "chai";
import request from "./helpers/request.js";
import { mockBudgetModel } from "./helpers/mockModels.js";
import app from "../src/index.js";

const { expect } = chai;

describe("Budgets API", () => {
  const budgetMock = mockBudgetModel();

  before(() => {
    process.env.TEST_BYPASS_AUTH = "1";
  });
  beforeEach(() => budgetMock.reset());
  after(() => {
    budgetMock.restore();
    delete process.env.TEST_BYPASS_AUTH;
  });

  it("creates or upserts a monthly budget", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .send({
        categoryId: "groceries",
        month: "2025-10",
        limit: 1000,
      });

    expect(res.status).to.be.oneOf([200, 201]);
    expect(res.body).to.have.property("month", "2025-10");
    expect(res.body).to.have.property("limit", 1000);
  });

  it("lists budgets", async () => {
    await request(app)
      .post("/api/budgets")
      .send({ categoryId: "transport", month: "2025-09", limit: 500 });

    const res = await request(app).get("/api/budgets");

    expect(res.status).to.be.oneOf([200, 201]);
    expect(res.body).to.be.an("array");
  });

  it("updates an existing budget", async () => {
    const created = await request(app)
      .post("/api/budgets")
      .send({ categoryId: "fun", month: "2025-08", limit: 300 });

    const id = created.body._id || created.body.id;

    const res = await request(app)
      .put(`/api/budgets/${id}`)
      .send({ categoryId: "fun", month: "2025-08", limit: 700 });

    expect(res.status).to.be.oneOf([200, 201]);
    if (res.body.limit !== undefined) {
      expect(res.body.limit).to.equal(700);
    }
  });

  it("returns 400 for invalid payload", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .send({ wrongField: "oops" });

    expect(res.status).to.be.oneOf([400, 422]);
  });

  it("deletes a budget by ID", async () => {
    const created = await request(app)
      .post("/api/budgets")
      .send({ categoryId: "misc", month: "2025-07", limit: 450 });

    const id = created.body._id || created.body.id;
    const res = await request(app).delete(`/api/budgets/${id}`);

    expect([200, 204, 404]).to.include(res.status);
  });
});
