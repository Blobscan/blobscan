import { formatWei } from "@blobscan/eth-units";

import { EtherUnitDisplay } from "./EtherUnitDisplay";

export const StandardEtherUnitDisplay = ({ wei }: { wei: bigint }) => {
  return (
    <div className="flex items-center justify-start gap-1">
      <EtherUnitDisplay wei={wei} toUnit="ether" />
      <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
        ({formatWei(wei, "Gwei")})
      </span>
    </div>
  );
};
