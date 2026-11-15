import { Skeleton } from "./Skeleton";

export function DetailsValueSkeleton({
  variant,
  count = 1,
  labels = [],
}: {
  variant: "badge" | "bar" | "distribution" | "subfields";
  labels?: string[];
  count?: number;
}) {
  if (variant === "subfields") {
    return (
      <div className="flex flex-col gap-4">
        {labels.map((label) => (
          <div key={label} className="flex items-center gap-1">
            <span className="mr-1 text-contentSecondary-light dark:text-contentSecondary-dark">
              {label}:
            </span>
            <Skeleton width={160} height={15} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} width={88} height={24} borderRadius={999} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs">
      <Skeleton width={180} height={15} />
      <div className="mt-2 leading-none">
        <Skeleton width="100%" height={4} borderRadius={6} />
      </div>
      {variant === "distribution" ? (
        <div className="mt-2 flex gap-3">
          {["Execution base", "Priority", "Blob"].map((label) => (
            <span
              key={label}
              className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark"
            >
              {label} <Skeleton width={32} height={12} />
            </span>
          ))}
        </div>
      ) : (
        <Skeleton width={48} height={12} />
      )}
    </div>
  );
}
