import type { FC, ReactNode } from "react";
import { Fragment } from "react";

import { Header } from "~/components/Header";
import type { CardProps } from "../Cards/Card";
import type { MetricCardProps } from "../Cards/MetricCard";
import { MetricCard } from "../Cards/MetricCard";

export type ValidatorsIncomeProps = {
  header: CardProps["header"];
  charts: ReactNode[];
  validatorKey: ReactNode;
  metrics?: MetricCardProps[];
};

export const ValidatorsIncomeLayout: FC<ValidatorsIncomeProps> = function ({
  header,
  charts,
  validatorKey,
  metrics,
}) {
  return (
    <>
      <Header>{header}</Header>
      <span className="text-sm text-gray-500">{validatorKey}</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics ? (
          metrics.map((metric, i) => <MetricCard key={i} {...metric} />)
        ) : (
          <div className="h-8 w-full" />
        )}
      </div>
      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-1 [&>div]:w-full`}>
        {charts.map((chart, i) => (
          <Fragment key={i}>{chart}</Fragment>
        ))}
      </div>
    </>
  );
};
