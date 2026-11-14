import type { FC } from "react";

import { ConcernedBlob } from "./ConcernedBlob";
import { ErrorViewLayout } from "./ErrorViewLayout";

export interface BadRequestErrorViewProps {
  title: string;
  description: string;
}

export const BadRequestErrorView: FC<BadRequestErrorViewProps> = function ({
  title,
  description,
}) {
  return (
    <ErrorViewLayout
      code="422"
      image={
        <ConcernedBlob className="h-auto w-[200px] max-w-full shrink-0 md:w-[350px] lg:w-[450px]" />
      }
      title={title}
      description={description}
    />
  );
};
