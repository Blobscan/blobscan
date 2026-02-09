import type { FC, ReactNode } from "react";
import Image from "next/image";

import { ErrorViewLayout } from "./ErrorViewLayout";

export interface NotFoundErrorViewProps {
  title: string;
  description: string;
  action?: ReactNode;
}

function GlowingEffect() {
  return (
    <div className="animate-glow absolute right-[20%] top-[70%] h-[0.5px] w-[0.5px] bg-transparent" />
  );
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
        <div className="relative">
          <GlowingEffect />
          <Image
            src="/not-found.png"
            alt="404"
            width={450}
            height={450}
            sizes="(max-width: 768px) 200px, (max-width: 1024px) 350px, 450px"
            className="h-[200px] w-[200px] md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px]"
            priority
          />
        </div>
      }
      title={title}
      description={description}
      action={action}
    />
  );
};
