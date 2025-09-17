import { withAuthed } from "../middlewares/withAuthed";
import type { ServiceClient } from "../utils";
import { publicProcedure } from "./public";

export const createAuthedProcedure = (expectedServiceClient: ServiceClient) =>
  publicProcedure.use(withAuthed(expectedServiceClient));
