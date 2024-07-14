import { EtherUnitDisplay } from "./EtherUnitDisplay";

export const StandardEtherUnitDisplay: React.FC<{
  amount: bigint | number;
}> = function ({ amount }) {
  return (
    <EtherUnitDisplay amount={amount} toUnit="DILL" alternateUnit="Gwei" />
  );
};
