import { withAuthed } from "../middlewares/withAuthed";
import type { APIClientType } from "../utils";
import { publicProcedure } from "./public";

export const createAuthedProcedure = (apiClientType: APIClientType) =>
  publicProcedure.use(withAuthed(apiClientType));
