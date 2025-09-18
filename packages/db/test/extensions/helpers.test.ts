import { describe, expect, it } from "vitest";

import { getPrisma } from "../../prisma";

describe("Helpers Extension", () => {
  const prisma = getPrisma();

  it("zero()", async () => {
    const result = await prisma.blob.zero();

    expect(result).toEqual([{ count: 0 }]);
  });

  describe("Block model", () => {
    describe("findLatest()", () => {
      it("should find the latest block correctly", async () => {
        const result = await prisma.block.findLatest();

        expect(result).toMatchSnapshot();
      });
    });
  });
});
