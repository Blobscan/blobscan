import os from "os";

import { BlobFileManager } from "./BlobFileManager";

export const blobFileManager = new BlobFileManager(os.tmpdir());
