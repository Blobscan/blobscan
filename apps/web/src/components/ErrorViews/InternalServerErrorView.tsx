import type { FC } from "react";

import { GlowableImage } from "../GlowableImage";
import { ReloadButton } from "../ReloadButton";
import { ErrorViewLayout } from "./ErrorViewLayout";

export const InternalServerErrorView: FC = () => {
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
          }}
        />
      }
      code={500}
      title="Internal Server Error"
      description="Oops! Something went wrong on our end."
      action={<ReloadButton className="w-60" />}
    />
  );
};
