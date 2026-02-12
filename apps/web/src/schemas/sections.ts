import { z } from "zod";

import { SECTION_NAMES } from "../components/Selectors/StatsSectionSelector";

export const statsSectionSchema = z.object({
  section: z.enum(SECTION_NAMES).default("all"),
});
