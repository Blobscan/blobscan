import { api } from "~/api-client";
import { EtherUnitDisplay } from "./Displays/EtherUnitDisplay";

export function GasPrice() {
  const { data: latestBlock } = api.block.getLatestBlock.useQuery();

  if (!latestBlock) {
    return undefined;
  }

  return (
    <div className="flex items-center gap-2">
      <EtherUnitDisplay amount={latestBlock.blobGasPrice.toString()} />
    </div>
  );
}
