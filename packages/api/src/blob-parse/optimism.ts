import { z } from "zod";

export const OptimismDecodedDataSchema = z.object({
  timestampSinceL2Genesis: z.number(),
  lastL1OriginNumber: z.number(),
  parentL2BlockHash: z.string(),
  l1OriginBlockHash: z.string(),
  numberOfL2Blocks: z.number(),
  changedByL1Origin: z.number(),
  totalTxs: z.number(),
  contractCreationTxsNumber: z.number(),
});

export type OptimismDecodedData = z.infer<typeof OptimismDecodedDataSchema>;

export function parseOptimismDecodedData(
  data: string
): OptimismDecodedData | null {
  let json;

  try {
    json = JSON.parse(data);
  } catch (error) {
    return null;
  }

  const decoded = OptimismDecodedDataSchema.safeParse(json);

  if (!decoded.success) {
    return null;
  }

  return decoded.data;
}
