import { convertWei } from "@blobscan/eth-format";

import { api } from "~/api-client";
import { EtherUnitDisplay } from "./Displays/EtherUnitDisplay";

function calculateUSDPrice(priceWei: number, ethPrice: number): string {
  const priceEth = convertWei(priceWei, "ether");

  return (Number(priceEth) * ethPrice).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  });
}

export function GasPrice() {
  const { data: latestBlock } = api.block.getLatestBlock.useQuery();
  const { data: priceData } = api.price.getEthPrice.useQuery();

  if (!latestBlock || !priceData) {
    return undefined;
  }

  return (
    <div className="flex items-center gap-2">
      <EtherUnitDisplay amount={latestBlock.blobGasPrice.toString()} />
      <div className="flex items-center gap-2 rounded-full border border-border-light bg-surface-light px-2 py-1 dark:border-border-dark dark:bg-surface-dark">
        {calculateUSDPrice(Number(latestBlock.blobGasPrice), priceData.usd)} USD
        <div className="font-normal opacity-50">
          ${priceData.usd.toLocaleString()}/ETH
        </div>
      </div>
    </div>
  );
}
