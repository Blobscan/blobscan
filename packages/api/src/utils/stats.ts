import dayjs, { type Dayjs } from "dayjs";

import { t } from "../client";
import { DATES_SCHEMA, withDates } from "../middlewares/withDates";
import { TIME_FRAME_SCHEMA, withTimeFrame } from "../middlewares/withTimeFrame";

export const STATS_PATH = "/stats";

export const BULK_INSERT_SIZE = 10_000;

export const timeSeriesProcedure = t.procedure
  .input(TIME_FRAME_SCHEMA)
  .use(withTimeFrame);
export const datesProcedure = t.procedure.input(DATES_SCHEMA).use(withDates);

export function toDailyDate(date: Dayjs | string | Date) {
  const date_ = dayjs(date);

  return date_.endOf("day").toISOString();
}
