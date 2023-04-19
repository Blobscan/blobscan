import React, { Fragment, type ReactNode } from "react";

type InfoGridProps = {
  fields: { name: ReactNode; value: ReactNode }[];
};

export const InfoGrid: React.FC<InfoGridProps> = function ({ fields }) {
  return (
    <div className="gri  grid gap-3 md:grid-cols-4">
      {fields.map(({ name, value }, i) => (
        <Fragment key={i}>
          <div className="font-bold dark:text-neutral-760">{name}</div>
          <div className="col-span-3 truncate text-sm">{value}</div>
        </Fragment>
      ))}
    </div>
  );
};
