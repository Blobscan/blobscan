import { withAuthed } from "../middlewares/withAuthed";
import type { ApiClient } from "../utils";
import { publicProcedure } from "./public";

export const createAuthedProcedure = (expectedServiceClient: ApiClient) =>
  publicProcedure.use(withAuthed(expectedServiceClient));
