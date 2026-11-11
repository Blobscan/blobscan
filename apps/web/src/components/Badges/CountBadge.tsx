import { formatNumber } from "~/utils/number";
import { Skeleton } from "~/components/Skeleton";
import { Badge } from "./Badge";

export function CountBadge({ count }: { count?: number }) {
  if (count === undefined) {
    return <Skeleton width={52} height={28} />;
  }

  return (
    <Badge
      variant="primary"
      size="sm"
      className="h-7 rounded-md font-medium tabular-nums text-accent-light dark:text-accent-dark"
    >
      {formatNumber(count)}
    </Badge>
  );
}
