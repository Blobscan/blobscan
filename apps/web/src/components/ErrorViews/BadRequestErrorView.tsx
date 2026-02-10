import type { FC } from "react";
import Image from "next/image";

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
        <Image
          src="/invalid.png"
          alt="Unprocessable Entity"
          width={450}
          height={450}
          sizes="(max-width: 768px) 200px, (max-width: 1024px) 350px, 450px"
          className="h-[200px] w-[200px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px]"
          priority
        />
      }
      title={title}
      description={description}
    />
  );
};
