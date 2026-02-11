import type { FC } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import React from "react";

import { ChartBase } from "../Charts/ChartBase";
import type { ChartBaseProps } from "../Charts/ChartBase";
import { Card } from "./Card";

type ChartCardProps = ChartBaseProps;

export const ChartCard: FC<ChartCardProps> = function (props) {
  return (
    <Card className="h-full" compact>
      <ChartBase {...props} />
    </Card>
  );
};
