import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByVersionedHash } from "./getByVersionedHash";

export const blobRouter = t.router({
  getAll,
  getByVersionedHash,
});
