import { type FC, type ReactNode } from "react";

import { Card, CardHeader } from "./Card";

type ChardCardProps = {
  title: ReactNode;
  children: React.ReactNode;
};

export const ChartCard: FC<ChardCardProps> = function ({ children, title }) {
  return (
    <Card compact>
      <div className="flex h-full flex-col gap-2">
        {children}
        <CardHeader inverse compact>
          <div className="flex justify-center text-sm">{title}</div>
        </CardHeader>
      </div>
    </Card>
  );
};
