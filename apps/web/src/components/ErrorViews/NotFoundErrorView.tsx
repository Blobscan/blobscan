import type { FC, ReactNode } from "react";
import Image from "next/image";

import { Glowable } from "../Glowable";
import { ErrorViewLayout } from "./ErrorViewLayout";

export interface NotFoundErrorViewProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const NotFoundErrorView: FC<NotFoundErrorViewProps> = function ({
  title,
  description,
  action,
}) {
  return (
    <ErrorViewLayout
      code="404"
      image={
        <Glowable right="20%" top="70%">
          <Image
            src="/not-found.png"
            alt="404"
            width={450}
            height={450}
            sizes="(max-width: 768px) 200px, (max-width: 1024px) 350px, 450px"
            className="h-[200px] w-[200px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px]"
            priority
          />
        </Glowable>
      }
      title={title}
      description={description}
      action={action}
    />
  );
};
