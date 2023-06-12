import { Storage } from "@google-cloud/storage";

import { STORAGE_KEYFILE, STORAGE_PROJECT_ID } from "../env";

export const storage = new Storage({
  projectId: STORAGE_PROJECT_ID,
  keyFile: STORAGE_KEYFILE,
});
