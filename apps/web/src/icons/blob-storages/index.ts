import type { FC, SVGProps } from "react";

import type { BlobStorage } from "~/types";
import file_system from "./file-system.svg";
import google from "./google.svg";
import postgres from "./postgres.svg";
import s3 from "./s3.svg";
import swarm from "./swarm.svg";
import weavevm from "./weavevm.svg";

type BlobStorageSVGRegistry = Record<
  BlobStorage,
  FC<SVGProps<SVGElement>> | string
>;

export const ICONS: BlobStorageSVGRegistry = {
  file_system,
  google,
  postgres,
  s3,
  swarm,
  weavevm,
};
