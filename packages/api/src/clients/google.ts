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

export function getStorage() {
  if (process.env.NODE_ENV === "development") {
    return new Storage({ apiEndpoint: "http://localhost:4443" });
  } else {
    return new Storage(credentials ? { credentials } : undefined);
  }
}

export const storage = getStorage();
