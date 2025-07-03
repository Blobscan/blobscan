/* eslint-disable @typescript-eslint/no-misused-promises */

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { BlobStoragesState } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import { fixtures, testValidError } from "@blobscan/test";

import type { SwarmStampCronJobConfig } from "../src/swarm-stamp/SwarmStampCronJob";
import { SwarmStampCronJob } from "../src/swarm-stamp/SwarmStampCronJob";

const BEE_ENDPOINT = process.env.BEE_ENDPOINT ?? "http://localhost:1633";

class SwarmStampCronJobMock extends SwarmStampCronJob {
  constructor({ batchId, cronPattern }: Partial<SwarmStampCronJobConfig> = {}) {
    super({
      redisUriOrConnection: process.env.REDIS_URI ?? "",
      cronPattern: cronPattern ?? "* * * * *",
      batchId: batchId ?? process.env.SWARM_BATCH_ID ?? "",
      beeEndpoint: BEE_ENDPOINT,
    });
  }

  getQueue() {
    return this.queue;
  }

  getWorkerProcessor() {
    return this.jobFn;
  }
}

describe("SwarmStampCronjob", () => {
  const expectedBatchId = fixtures.blobStoragesState[0]?.swarmDataId as string;
  const expectedBatchTTL = 1000;

  let swarmStampCronJob: SwarmStampCronJobMock;

  beforeAll(() => {
    const baseUrl = `${BEE_ENDPOINT}/stamps`;
    const server = setupServer(
      ...[
        http.get(`${baseUrl}/:batchId`, ({ request }) => {
          const batchId = request.url.split("/").pop();

          if (!batchId || batchId.length !== 64) {
            return HttpResponse.json(
              {
                code: 400,
                message: "invalid path params",
                reasons: [
                  {
                    field: "batch_id",
                    error: "odd length hex string",
                  },
                ],
              },
              { status: 400 }
            );
          }

          if (batchId !== expectedBatchId) {
            return HttpResponse.json(
              {
                code: 404,
                message: "issuer does not exist",
              },
              { status: 404 }
            );
          }

          return HttpResponse.json(
            {
              batchID: expectedBatchId,
              batchTTL: expectedBatchTTL,
            },
            {
              status: 200,
            }
          );
        }),
      ]
    );

    server.listen();

    return () => {
      server.close();
    };
  });

  beforeEach(() => {
    swarmStampCronJob = new SwarmStampCronJobMock();

    return async () => {
      await swarmStampCronJob.close();
    };
  });

  describe("when creating a new swarm batch data row in the db", async () => {
    let blobStorageState: BlobStoragesState | null = null;

    beforeEach(async () => {
      await prisma.blobStoragesState.deleteMany();

      const workerProcessor = swarmStampCronJob.getWorkerProcessor();

      await workerProcessor().catch((err) => console.log(err));

      blobStorageState = await prisma.blobStoragesState.findFirst();
    });

    it("should create it with the correct swarm stamp batch ID", async () => {
      expect(blobStorageState?.swarmDataId).toBe(process.env.SWARM_BATCH_ID);
    });

    it("should create it with the correct batch TTL", async () => {
      expect(blobStorageState?.swarmDataTTL).toBe(expectedBatchTTL);
    });
  });

  it("should update the batch TTl", async () => {
    await prisma.blobStoragesState.update({
      data: {
        swarmDataTTL: 99999,
      },
      where: {
        id: 1,
      },
    });

    const workerProcessor = swarmStampCronJob.getWorkerProcessor();
    await workerProcessor();

    const blobStorageState = await prisma.blobStoragesState.findFirst();

    expect(blobStorageState?.swarmDataTTL).toBe(expectedBatchTTL);
  });

  testValidError(
    "should fail when trying to fetch a non-existing batch",
    async () => {
      const failingSwarmStampCronJob = new SwarmStampCronJobMock({
        batchId:
          "6b538866048cfb6e9e1d06805374c51572c11219d2d550c03e6e277366cb0371",
      });
      const failingWorkerProcessor =
        failingSwarmStampCronJob.getWorkerProcessor();

      await failingWorkerProcessor().finally(async () => {
        await failingSwarmStampCronJob.close();
      });
    },
    Error,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should fail when trying to fetch an invalid batch",
    async () => {
      const failingSwarmStampCronJob = new SwarmStampCronJobMock({
        batchId: "invalid-batch",
      });
      const failingWorkerProcessor =
        failingSwarmStampCronJob.getWorkerProcessor();

      await failingWorkerProcessor().finally(async () => {
        await failingSwarmStampCronJob.close();
      });
    },
    Error,
    {
      checkCause: true,
    }
  );
});
