import React, { Fragment } from "react";
import type { ReactNode } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

export type InfoGridProps = {
  fields?: { name: ReactNode; value: ReactNode }[];
};

export const InfoGrid: React.FC<InfoGridProps> = function ({ fields }) {
  return (
    <div className="grid w-fit gap-3 md:grid-cols-4">
      {!fields
        ? Array.from({ length: 4 }).map((_, i) => (
            <Fragment key={i}>
              <div>
                <Skeleton width={180} />
              </div>
              <div className="col-span-3">
                <Skeleton width={400} />
              </div>
            </Fragment>
          ))
        : fields.map(({ name, value }, i) => (
            <Fragment key={i}>
              <div className="font-semibold dark:text-coolGray-400">{name}</div>
              <div className="col-span-3 truncate text-sm">{value}</div>
            </Fragment>
          ))}
    </div>
  );
};
