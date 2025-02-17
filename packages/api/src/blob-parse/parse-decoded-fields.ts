import { z } from "zod";

import {
  parseOptimismDecodedData,
  OptimismDecodedDataSchema,
} from "./optimism";

const OptimismSchema = z.object({
  type: z.literal("optimism"),
  payload: OptimismDecodedDataSchema,
});

const UnknownSchema = z.object({
  type: z.literal("unknown"),
  payload: z.string(),
});

export const decodedFields = z.union([OptimismSchema, UnknownSchema]);

type DecodedFields = z.infer<typeof decodedFields>;

export function parseDecodedFields(data: string): DecodedFields {
  const optimismDecodedData = parseOptimismDecodedData(data);

  if (optimismDecodedData) {
    return {
      type: "optimism",
      payload: optimismDecodedData,
    };
  }

  return {
    type: "unknown",
    payload: data,
  };
}
