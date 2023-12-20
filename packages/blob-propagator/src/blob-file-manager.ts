import os from "os";

import { BlobFileManager } from "./BlobFileManager";
import { env } from "./env";

const basePath = !env.TEST ? os.tmpdir() : undefined;

export const blobFileManager = new BlobFileManager({
  basePath,
  folderName: ".blob-files-test",
});
