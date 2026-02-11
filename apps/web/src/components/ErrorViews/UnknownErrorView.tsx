import type { FC } from "react";

import { GlowableImage } from "../GlowableImage";
import { ReloadButton } from "../ReloadButton";
import { ErrorViewLayout } from "./ErrorViewLayout";

export interface UnknownErrorViewProps {
  code?: string | number;
}

export const UnknownErrorView: FC<UnknownErrorViewProps> = ({ code }) => {
  return (
    <ErrorViewLayout
      image={
        <GlowableImage
          right="50%"
          top="25%"
          imageProps={{
            src: "/internal-error.png",
            alt: "Internal Server Error",
            width: 390,
            height: 480,
            sizes: "(max-width: 768px) 200px, (max-width: 1024px) 350px, 450px",
            className: "h-[240px] w-[200px] md:h-[480px] md:w-[390px]",
            priority: true,
          }}
        />
      }
      code={code ?? "Error"}
      title="Something went wrong"
      description="We ran into an unexpected issue while processing your request."
      action={<ReloadButton className="w-60" />}
    />
  );
};
