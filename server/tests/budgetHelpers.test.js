import { expect } from "chai";
import mongoose from "mongoose";
import { computeBudgetId, normalizePayload } from "../src/routes/budgets.js";

describe("Budget helpers", () => {
  it("computes deterministic budget id", () => {
    const id = computeBudgetId("user123", "groceries", "2025-02");
    expect(id).to.equal("user123:groceries:2025-02");
  });

  it("normalizes payload and attaches user when owner is ObjectId", () => {
    const ownerKey = new mongoose.Types.ObjectId().toString();
    const payload = normalizePayload(
      { categoryId: "rent", month: "2025-02", limit: 1000 },
      ownerKey,
    );

    expect(payload).to.include({
      ownerKey,
      categoryId: "rent",
      month: "2025-02",
      limit: 1000,
    });
    expect(payload).to.have.property("id", `${ownerKey}:rent:2025-02`);
    expect(String(payload.user)).to.equal(ownerKey);
  });
});
