import { formatNumber } from "~/utils/number";
import { Skeleton } from "~/components/Skeleton";
import { Badge } from "./Badge";

export function CountBadge({ count }: { count?: number }) {
  if (count === undefined) {
    return <Skeleton width={52} height={32} />;
  }

  return (
    <Badge variant="primary" size="sm" className="font-normal tabular-nums">
      {formatNumber(count)}
    </Badge>
  );
}
