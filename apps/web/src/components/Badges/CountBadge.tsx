import { formatNumber } from "~/utils/number";
import { ContentReveal } from "~/components/ContentReveal";
import { Skeleton } from "~/components/Skeleton";
import { Badge } from "./Badge";

const countBadgeSizes = {
  xs: { className: "h-6 px-2", height: 24, width: 48 },
  sm: { className: "h-7 px-2", height: 28, width: 56 },
  md: { className: "h-8 px-2.5", height: 32, width: 64 },
};

type CountBadgeProps = {
  count?: number;
  label?: string;
  size?: keyof typeof countBadgeSizes;
};

export function CountBadge({ count, label, size = "md" }: CountBadgeProps) {
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
          {label ? ` ${label}` : ""}
        </Badge>
      )}
    </ContentReveal>
  );
}
