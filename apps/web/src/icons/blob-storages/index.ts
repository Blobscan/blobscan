import type { BlobStorage } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import file_system from "./file-system.svg";
import google from "./google.svg";
import postgres from "./postgres.svg";
import s3 from "./s3.svg";
import swarm from "./swarm.svg";
import weavevm from "./weavevm.svg";

type BlobStorageSVGRegistry = Record<BlobStorage, RenderableIcon>;

export const ICONS: BlobStorageSVGRegistry = {
  file_system,
  google,
  postgres,
  s3,
  swarm,
  weavevm,
};
