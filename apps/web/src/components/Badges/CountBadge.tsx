import { formatNumber } from "~/utils/number";
import { ContentReveal } from "~/components/ContentReveal";
import { Skeleton } from "~/components/Skeleton";
import { Badge } from "./Badge";

const countBadgeSizes = {
  sm: { className: "h-[18px] px-1 text-[11px]", height: 18, width: 36 },
  md: { className: "h-[22px] px-1.5 text-[13px]", height: 22, width: 44 },
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
