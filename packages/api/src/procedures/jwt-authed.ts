import { isJWTAuthed } from "../middlewares/isJWTAuthed";
import { publicProcedure } from "./public";

export const jwtAuthedProcedure = publicProcedure.use(isJWTAuthed);
