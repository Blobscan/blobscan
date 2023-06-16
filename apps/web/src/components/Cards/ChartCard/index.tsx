import { type FC, type ReactNode } from "react";

import { CardTitleBase } from "../Bases";
import { SurfaceCardBase } from "../SurfaceCards/SurfaceCardBase";

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
    <SurfaceCardBase className={className}>
      <div className="flex flex-col gap-7">
        {children}
        <CardTitleBase type="footer">
          <div className="flex justify-center">{title}</div>
        </CardTitleBase>
      </div>
    </SurfaceCardBase>
  );
};
