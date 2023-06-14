import { type FC, type ReactNode } from "react";

import { CardBase, CardTitleBase } from "../Bases";

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
          <div className="flex justify-center">{title}</div>
        </CardTitleBase>
      </div>
    </CardBase>
  );
};
