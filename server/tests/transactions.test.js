import chai from "chai";
import request from "./helpers/request.js";
import { mockTransactionModel } from "./helpers/mockModels.js";
import app from "../src/index.js";

const { expect } = chai;

describe("Transactions API", () => {
  const transactionMock = mockTransactionModel();

  before(() => {
    process.env.TEST_BYPASS_AUTH = "1";
  });

  beforeEach(() => {
    transactionMock.reset();
  });

  after(() => {
    transactionMock.restore();
    delete process.env.TEST_BYPASS_AUTH;
  });

  it("creates a transaction", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        date: "2025-01-10",
        categoryId: "groceries",
        type: "expense",
        amount: 25.5,
      });

    expect(res.status).to.equal(201);
    expect(res.body).to.include({
      date: "2025-01-10",
      categoryId: "groceries",
      type: "expense",
    });
    expect(res.body).to.have.property("_id");
  });

  it("lists transactions for the current user", async () => {
    await request(app)
      .post("/api/transactions")
      .send({
        date: "2025-01-11",
        categoryId: "rent",
        type: "expense",
        amount: 500,
      });

    const res = await request(app).get("/api/transactions");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body[0]).to.have.property("categoryId", "rent");
  });

  it("updates an existing transaction", async () => {
    const created = await request(app)
      .post("/api/transactions")
      .send({
        date: "2025-01-12",
        categoryId: "salary",
        type: "income",
        amount: 2000,
      });

    const id = created.body._id;

    const res = await request(app)
      .put(`/api/transactions/${id}`)
      .send({
        date: "2025-01-12",
        categoryId: "salary",
        type: "income",
        amount: 2200,
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("amount", 2200);
  });

  it("deletes a transaction", async () => {
    const created = await request(app)
      .post("/api/transactions")
      .send({
        date: "2025-01-13",
        categoryId: "fun",
        type: "expense",
        amount: 75,
      });

    const id = created.body._id;
    const res = await request(app).delete(`/api/transactions/${id}`);

    expect([200, 204]).to.include(res.status);
  });
});
