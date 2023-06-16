import React, { Fragment, type ReactNode } from "react";

export type InfoGridProps = {
  fields: { name: ReactNode; value: ReactNode }[];
};

export const InfoGrid: React.FC<InfoGridProps> = function ({ fields }) {
  return (
    <div className="grid w-fit gap-3 md:grid-cols-4">
      {fields.map(({ name, value }, i) => (
        <Fragment key={i}>
          <div className="font-semibold dark:text-coolGray-400">{name}</div>
          <div className="col-span-3 truncate text-sm">{value}</div>
        </Fragment>
      ))}
    </div>
  );
};
