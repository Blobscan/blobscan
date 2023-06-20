import { Storage } from "@google-cloud/storage";

import { env } from "../env";

type GoogleCredential = {
  client_email: string;
  private_key: string;
};

const credentials =
  env.GOOGLE_SERVICE_KEY && env.GOOGLE_STORAGE_PROJECT_ID
    ? (JSON.parse(
        Buffer.from(env.GOOGLE_SERVICE_KEY, "base64").toString(),
      ) as GoogleCredential)
    : undefined;

export function getStorage() {
  if (env.NODE_ENV === "development") {
    return new Storage({ apiEndpoint: "http://localhost:4443" });
  } else {
    return new Storage(credentials ? { credentials } : undefined);
  }
}

export const storage = getStorage();
