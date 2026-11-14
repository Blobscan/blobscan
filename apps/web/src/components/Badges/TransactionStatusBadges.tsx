import { BlockStatusBadge } from "./BlockStatusBadge";
import { StatusBadge } from "./StatusBadge";

export function TransactionStatusBadges({
  blockNumber,
  executionStatus,
}: {
  blockNumber: number;
  executionStatus?: "success" | "failed" | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BlockStatusBadge blockNumber={blockNumber} />
      {executionStatus && <StatusBadge status={executionStatus} />}
    </div>
  );
}
