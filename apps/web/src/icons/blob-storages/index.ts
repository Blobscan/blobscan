import type { BlobStorage } from "~/types";
import type { RenderableIcon } from "~/types/icons";
import google from "./google.svg";
import postgres from "./postgres.svg";
import s3 from "./s3.svg";
import swarm from "./swarm.svg";
import weavevm from "./weavevm.svg";

type BlobStorageSVGRegistry = Record<BlobStorage, RenderableIcon>;

export const ICONS: BlobStorageSVGRegistry = {
  google,
  postgres,
  s3,
  swarm,
  swarmycloud: swarm,
  weavevm,
};
