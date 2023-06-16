import { type FC, type ReactNode } from "react";

import { CardTitleBase } from "../Bases";
import { CardBase } from "../CardBase";

type ChardCardProps = {
  title: ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const ChartCard: FC<ChardCardProps> = function ({
  children,
  title,
  className = "",
}) {
  return (
    <CardBase className={className}>
      <div className="flex flex-col gap-7">
        {children}
        <CardTitleBase type="footer">
          <div className="flex justify-center text-sm">{title}</div>
        </CardTitleBase>
      </div>
    </CardBase>
  );
};
