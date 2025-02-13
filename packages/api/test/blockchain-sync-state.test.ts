import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { BlockchainSyncState } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { appRouter } from "../src/app-router";
import { createTestContext, unauthorizedRPCCallTest } from "./helpers";

describe("Blockchain sync state route", async () => {
  let nonAuthorizedCaller: ReturnType<typeof appRouter.createCaller>;
  let authorizedCaller: ReturnType<typeof appRouter.createCaller>;
  let authorizedContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    const ctx = await createTestContext();

    authorizedContext = await createTestContext({
      apiClient: { type: "indexer" },
    });

    nonAuthorizedCaller = appRouter.createCaller(ctx);
    authorizedCaller = appRouter.createCaller(authorizedContext);
  });

  describe("getState", () => {
    it("should get blockchain sync state", async () => {
      const result = await nonAuthorizedCaller.syncState.getState();
      const expectedState = {
        ...fixtures.blockchainSyncState[0],
      };
      delete expectedState?.id;

      expect(result).toMatchObject(expectedState);
    });
  });

  describe("updateState", () => {
    describe("when authorized", () => {
      describe("when updating blockchain sync state", () => {
        let prevBlockchainSyncState: BlockchainSyncState;

        beforeEach(async () => {
          const state =
            await authorizedContext.prisma.blockchainSyncState.findFirst();

          if (!state) {
            throw new Error("Blockchain sync state should exist");
          }

          prevBlockchainSyncState = state;
        });

        it("should update the last finalized block correctly", async () => {
          const newLastFinalizedBlock = 2000;

          await authorizedCaller.syncState.updateState({
            lastFinalizedBlock: newLastFinalizedBlock,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findFirst();

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastFinalizedBlock: newLastFinalizedBlock,
          });
        });

        it("should update the last lower synced slot correctly", async () => {
          const newLastLowerSyncedSlot = 2000;

          await authorizedCaller.syncState.updateState({
            lastLowerSyncedSlot: newLastLowerSyncedSlot,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findFirst();

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastLowerSyncedSlot: newLastLowerSyncedSlot,
          });
        });

        it("should update the last upper synced slot correctly", async () => {
          const newLastUpperSyncedSlot = 2000;

          await authorizedCaller.syncState.updateState({
            lastUpperSyncedSlot: newLastUpperSyncedSlot,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findFirst();

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastUpperSyncedSlot: newLastUpperSyncedSlot,
          });
        });

        it("should update the last upper synced block root correctly", async () => {
          const newLastUpperSyncedBlockRoot = "0x".padEnd(66, "1");

          await authorizedCaller.syncState.updateState({
            lastUpperSyncedBlockRoot: newLastUpperSyncedBlockRoot,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findFirst();

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastUpperSyncedBlockRoot: newLastUpperSyncedBlockRoot,
          });
        });

        it("should update the last upper synced block slot correctly", async () => {
          const newLastUpperSyncedBlockSlot = 2000;

          await authorizedCaller.syncState.updateState({
            lastUpperSyncedBlockSlot: newLastUpperSyncedBlockSlot,
          });

          const afterBlockchainSyncState =
            await authorizedContext.prisma.blockchainSyncState.findFirst();

          expect(afterBlockchainSyncState).toMatchObject({
            ...prevBlockchainSyncState,
            lastUpperSyncedBlockSlot: newLastUpperSyncedBlockSlot,
          });
        });

        it("should update all fields correctly", async () => {
          const newBlockchainSyncState = {
            lastFinalizedBlock: 2001,
            lastLowerSyncedSlot: 30,
            lastUpperSyncedSlot: 560,
            lastUpperSyncedBlockRoot: "0x".padEnd(66, "1"),
            lastUpperSyncedBlockSlot: 2000,
          };

          await authorizedCaller.syncState.updateState(newBlockchainSyncState);

          const afterBlockchainSyncState =
            await await authorizedContext.prisma.blockchainSyncState.findFirst();

          expect(afterBlockchainSyncState).toMatchObject(
            newBlockchainSyncState
          );
        });
      });

      it("should fail when trying to update last lower synced slot to a value greater than last upper synced slot", async () => {
        const newState = {
          lastLowerSyncedSlot: 1001,
          lastUpperSyncedSlot: 1000,
        };

        await expect(
          authorizedCaller.syncState.updateState(newState)
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          '"Last lower synced slot must be less than or equal to last upper synced slot"'
        );
      });
    });

    unauthorizedRPCCallTest(() =>
      nonAuthorizedCaller.syncState.updateState({
        lastLowerSyncedSlot: 1001,
      })
    );
  });
});
