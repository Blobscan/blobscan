import { formatNumber } from "~/utils/number";
import { ContentReveal } from "~/components/ContentReveal";
import { Skeleton } from "~/components/Skeleton";
import { Badge } from "./Badge";

export function CountBadge({ count }: { count?: number }) {
  return (
    <ContentReveal
      isLoading={count === undefined}
      className="flex h-8 items-center"
    >
      {count === undefined ? (
        <Skeleton
          width={64}
          height={32}
          borderRadius={9999}
          containerClassName="flex"
        />
      ) : (
        <Badge variant="primary" size="sm" className="font-normal tabular-nums">
          {formatNumber(count)}
        </Badge>
      )}
    </ContentReveal>
  );
}
