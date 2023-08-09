import { isJWTAuthed } from "../middlewares/isJWTAuthed";
import { publicProcedure } from "./publicProcedure";

export const jwtAuthedProcedure = publicProcedure.use(isJWTAuthed);
