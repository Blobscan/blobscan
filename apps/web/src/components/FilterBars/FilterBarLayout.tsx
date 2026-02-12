import type { FC, ReactNode } from "react";

import { Button } from "~/components/Button";
import { Card } from "../Cards/Card";

export type FilterBarLayoutProps = {
  children: ReactNode;
  onClear: () => void;
  onApply: () => void;
  disableClear?: boolean;
};

export const FilterBarLayout: FC<FilterBarLayoutProps> = ({
  children,
  onClear,
  onApply,
  disableClear,
}) => {
  return (
    <Card compact>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:justify-start lg:gap-0">
        <div className="flex w-full flex-col items-center gap-2 lg:flex-row lg:justify-start">
          {children}
        </div>

        <div className="flex gap-2 md:flex-row lg:ml-2">
          <Button
            className="w-full lg:px-3 xl:px-6"
            variant="outline"
            onClick={onClear}
            disabled={disableClear}
          >
            Clear
          </Button>
          <Button className="w-full lg:px-3 xl:px-6" onClick={onApply}>
            Filter
          </Button>
        </div>
      </div>
    </Card>
  );
};
