import { Storage } from "@google-cloud/storage";

import { GOOGLE_SERVICE_KEY, STORAGE_PROJECT_ID } from "../env";

type GoogleCredential = {
  client_email: string;
  private_key: string;
};

const credential = JSON.parse(
  Buffer.from(GOOGLE_SERVICE_KEY, "base64").toString(),
) as GoogleCredential;

export const storage = new Storage({
  projectId: STORAGE_PROJECT_ID,
  credentials: {
    client_email: credential.client_email,
    private_key: credential.private_key,
  },
});
