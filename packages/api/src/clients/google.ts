import { Storage } from "@google-cloud/storage";

import { GOOGLE_SERVICE_KEY, STORAGE_PROJECT_ID } from "../env";

type GoogleCredential = {
  client_email: string;
  private_key: string;
};

const credentials =
  GOOGLE_SERVICE_KEY && STORAGE_PROJECT_ID
    ? (JSON.parse(
        Buffer.from(GOOGLE_SERVICE_KEY, "base64").toString(),
      ) as GoogleCredential)
    : undefined;

export const storage = new Storage(credentials ? { credentials } : undefined);
