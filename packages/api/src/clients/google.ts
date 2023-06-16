import { Storage } from "@google-cloud/storage";

import { STORAGE_KEYFILE_PATH, STORAGE_PROJECT_ID } from "../env";

export const storage = new Storage({
  projectId: STORAGE_PROJECT_ID,
  keyFilename: STORAGE_KEYFILE_PATH,
});
