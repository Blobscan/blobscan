import type { FC } from "react";
import Skeleton from "react-loading-skeleton";

import "react-loading-skeleton/dist/skeleton.css";
import { ExpandableContent } from "../../ExpandableContent";
import type { BlobViewProps } from "../index";

export type RawBlobViewProps = BlobViewProps<string>;

export const RawBlobView: FC<RawBlobViewProps> = function ({ data }) {
  return (
    <div className="break-words p-3 text-left text-sm leading-7">
      {data !== undefined ? (
        <ExpandableContent>{data}</ExpandableContent>
      ) : (
        <Skeleton count={10} />
      )}
    </div>
  );
};
