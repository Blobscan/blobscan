import type { FC } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import { Button } from "../Button";
import { ErrorViewLayout } from "./ErrorViewLayout";

function GlowingEffect() {
  return (
    <div className="animate-glow absolute right-[50%] top-[25%] h-[0.5px] w-[0.5px] bg-transparent" />
  );
}

export interface UnknownErrorViewProps {
  code: string | number;
}

export const UnknownErrorView: FC<UnknownErrorViewProps> = ({ code }) => {
  const router = useRouter();

  return (
    <ErrorViewLayout
      image={
        <div className="relative">
          <GlowingEffect />
          <Image
            src="/internal-error.png"
            alt="Internal Server Error"
            width={390}
            height={480}
            sizes="(max-width: 768px) 200px, (max-width: 1024px) 350px, 450px"
            className="h-[240px] w-[200px] md:h-[480px] md:w-[390px]"
          />
        </div>
      }
      code={code}
      title="Something went wrong"
      description="We ran into an unexpected issue while processing your request."
      action={
        <Button onClick={() => router.reload()} className="w-72">
          Refresh
        </Button>
      }
    />
  );
};
