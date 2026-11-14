import type { FC } from "react";

import { ReloadButton } from "../ReloadButton";
import { ErrorIllustrationLayout } from "./ErrorIllustrationLayout";
import { ServerErrorBlob } from "./ServerErrorBlob";

export const InternalServerErrorView: FC = () => {
  return (
    <ErrorIllustrationLayout
      image={<ServerErrorBlob />}
      code={500}
      title={"Internal\nserver error"}
      description="An unexpected server error occurred. Please reload the page to try again."
      action={<ReloadButton className="h-auto px-5 py-3" />}
    />
  );
};
