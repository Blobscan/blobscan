import type { FC, ReactNode } from "react";
import cn from "classnames";

import { Card } from "~/components/Cards/Card";
import { Skeleton } from "~/components/Skeleton";

export type AddressMetricCardProps = {
  name: string;
  /** Undefined while the data loads. */
  value?: ReactNode;
  /** A short line under the value, for example an average. */
  detail?: ReactNode;
  /**
   * The value of the other role (for example "Received: 3"). The card shows
   * it only for an address with both roles.
   */
  otherRole?: { label: string; value: ReactNode };
  isLoading?: boolean;
};

export const AddressMetricCard: FC<AddressMetricCardProps> = function ({
  name,
  value,
  detail,
  otherRole,
  isLoading,
}) {
  return (
    <Card compact className="h-full">
      <div className="flex h-full flex-col gap-1 p-1">
        <div className="text-sm font-semibold text-contentSecondary-light dark:text-contentSecondary-dark">
          {name}
        </div>
        {isLoading ? (
          <>
            <Skeleton width="60%" height={28} />
            <Skeleton width="80%" size="xs" />
          </>
        ) : (
          <>
            <div className="break-words text-xl font-semibold tabular-nums text-content-light dark:text-content-dark lg:text-2xl">
              {value ?? "–"}
            </div>
            {detail && (
              <div className="text-xs tabular-nums text-contentSecondary-light dark:text-contentSecondary-dark">
                {detail}
              </div>
            )}
            {otherRole && (
              <div
                className={cn(
                  "mt-auto border-t border-dashed border-border-light pt-1.5 text-xs tabular-nums",
                  "text-contentTertiary-light dark:border-border-dark dark:text-contentTertiary-dark"
                )}
              >
                <span className="font-medium text-contentSecondary-light dark:text-contentSecondary-dark">
                  {otherRole.label}:
                </span>{" "}
                {otherRole.value}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};
