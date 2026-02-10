import type { FC } from "react";
import { useRouter } from "next/router";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

import { Button } from "./Button";
import { Icon } from "./Icon";

export const ReloadButton: FC<{ className?: string }> = function ({
  className,
}) {
  const router = useRouter();

  return (
    <Button className={className} onClick={() => router.reload()}>
      <div className="flex items-center justify-center gap-1">
        <Icon src={ArrowPathIcon} size="md" />
        Reload
      </div>
    </Button>
  );
};
