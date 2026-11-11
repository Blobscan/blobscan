import { formatNumber } from "~/utils/number";
import { ContentReveal } from "~/components/ContentReveal";
import { Skeleton } from "~/components/Skeleton";
import { Badge } from "./Badge";

const countBadgeSizes = {
  sm: { className: "h-5 px-1.5 text-xs", height: 20, width: 40 },
  md: { className: "h-6 px-2 text-sm", height: 24, width: 48 },
};

type CountBadgeProps = {
  count?: number;
  size?: keyof typeof countBadgeSizes;
};

export function CountBadge({ count, size = "md" }: CountBadgeProps) {
  const { className, height, width } = countBadgeSizes[size];

  return (
    <ContentReveal
      isLoading={count === undefined}
      className="inline-flex shrink-0 items-center align-middle"
    >
      {count === undefined ? (
        <Skeleton
          width={width}
          height={height}
          borderRadius={9999}
          containerClassName="flex"
        />
      ) : (
        <Badge
          variant="primary"
          size={size}
          className={`${className} font-normal tabular-nums`}
        >
          {formatNumber(count)}
        </Badge>
      )}
    </ContentReveal>
  );
}
