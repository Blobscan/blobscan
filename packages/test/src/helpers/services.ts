import { Storage } from "@google-cloud/storage";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;
let storage: Storage | undefined;

export const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }

  return prisma;
};

export const getStorage = () => {
  if (!storage) {
    storage = new Storage({
      apiEndpoint: "http://localhost:8080",
      projectId: "blobscan",
    });
  }

  return storage;
};
