import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { BlobStoragesState } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import { fixtures, testValidError } from "@blobscan/test";

import { CronJobError } from "../src/cron-jobs/BaseCronJob";
import type { SwarmStampCronJobConfig } from "../src/cron-jobs/swarm-stamp/SwarmStampCronJob";
import { SwarmStampCronJob } from "../src/cron-jobs/swarm-stamp/SwarmStampCronJob";
import workerProcessor from "../src/cron-jobs/swarm-stamp/processor";
import type { SwarmStampJob } from "../src/cron-jobs/swarm-stamp/types";

const BEE_ENDPOINT = process.env.BEE_ENDPOINT ?? "http://localhost:1633";

class SwarmStampCronJobMock extends SwarmStampCronJob {
  constructor({ batchId, cronPattern }: Partial<SwarmStampCronJobConfig> = {}) {
    super({
      redisUriOrConnection: process.env.REDIS_URI ?? "",
      cronPattern: cronPattern ?? "* * * * *",
      batchId,
      beeEndpoint: BEE_ENDPOINT,
    });
  }

  getQueue() {
    return this.queue;
  }
}

describe("SwarmStampCronjob", () => {
  const expectedBatchId = fixtures.blobStoragesState[0]?.swarmDataId as string;
  const expectedBatchTTL = 1000;

  const job = {
    data: {
      batchId: expectedBatchId,
      beeEndpoint: BEE_ENDPOINT,
    },
  } as SwarmStampJob;

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

  describe("when creating a new instance", () => {
    let swarmStampCronJob: SwarmStampCronJobMock;

    beforeEach(() => {
      swarmStampCronJob = new SwarmStampCronJobMock();

      return async () => {
        await swarmStampCronJob.close();
      };
    });

    it("should fetch batch id from db if none is provided", async () => {
      const job = await swarmStampCronJob.start();

      expect(job?.data).toEqual({
        batchId: expectedBatchId,
        beeEndpoint: BEE_ENDPOINT,
      });
    });

    testValidError(
      "should throw a valid error when no batch id was found and none was provided",
      async () => {
        await prisma.blobStoragesState.deleteMany();

        await swarmStampCronJob.start();
      },
      CronJobError,
      {
        checkCause: true,
      }
    );
  });

  describe("when creating a new swarm batch data row in the db", async () => {
    let blobStorageState: BlobStoragesState | null = null;

    beforeEach(async () => {
      await prisma.blobStoragesState.deleteMany();

      await workerProcessor(job).catch((err: unknown) => console.log(err));

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

    await workerProcessor(job);

    const blobStorageState = await prisma.blobStoragesState.findFirst();

    expect(blobStorageState?.swarmDataTTL).toBe(expectedBatchTTL);
  });

  testValidError(
    "should fail when trying to fetch a non-existing batch",
    async () => {
      const job = {
        data: {
          batchId:
            "6b538866048cfb6e9e1d06805374c51572c11219d2d550c03e6e277366cb0371",
          beeEndpoint: BEE_ENDPOINT,
        },
      } as SwarmStampJob;

      await workerProcessor(job);
    },
    Error,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should fail when trying to fetch an invalid batch",
    async () => {
      const job = {
        data: {
          batchId: "invalid-batch",
          beeEndpoint: BEE_ENDPOINT,
        },
      } as SwarmStampJob;

      await workerProcessor(job);
    },
    Error,
    {
      checkCause: true,
    }
  );
});
