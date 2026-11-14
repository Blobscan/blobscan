import type { FC } from "react";

import { BlobIcon } from "../BlobIcon";
import { ReloadButton } from "../ReloadButton";
import { ErrorViewLayout } from "./ErrorViewLayout";

export interface UnknownErrorViewProps {
  code?: string | number;
}

export const UnknownErrorView: FC<UnknownErrorViewProps> = ({ code }) => {
  return (
    <ErrorViewLayout
      image={
        <BlobIcon
          variant="illustration"
          className="h-[200px] w-[200px] shrink-0 text-accent-light dark:text-accent-dark md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px]"
        />
      }
      code={code ?? "Error"}
      title="Something went wrong"
      description="We ran into an unexpected issue while processing your request."
      action={<ReloadButton className="w-60" />}
    />
  );
};
