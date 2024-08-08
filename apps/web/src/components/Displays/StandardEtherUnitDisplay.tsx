import { formatWei } from "@blobscan/eth-units";

import { EtherUnitDisplay } from "./EtherUnitDisplay";

export const StandardEtherUnitDisplay = ({ amount }: { amount: bigint }) => {
  return (
    <div className="flex items-center justify-start gap-1">
      <EtherUnitDisplay amount={amount} toUnit="ether" />
      <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
        ({formatWei(amount, "Gwei")})
      </span>
    </div>
  );
};
