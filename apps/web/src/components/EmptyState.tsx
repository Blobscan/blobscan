import Image from "next/image";
import cn from "classnames";

import type { Size } from "~/types";
import emptyImage from "../../public/empty.png";

// A small preview of public/empty.png. It needs no image request.
const EMPTY_IMAGE_PREVIEW =
  "data:image/webp;base64,UklGRngBAABXRUJQVlA4WAoAAAAQAAAAFwAACQAAQUxQSMgAAAABgGLb2rLl+f1vWLYEyZnAv2g+AXcnQXJ3509IdetUb+4DcHd73/dedA4RMQEWi1VS9s1ZtUusFrGHJ3kig31sIhablBEwnLRJyMjBO/nxcH68W2STwGsq4JOpkkwDA5KKQ3ZJpwagOC+JVAYAzAf7HdJKRdJwI/uEBn9qDjnF+wd4N0xDEiA1h+0y/gfBhS5qgCQUve7yeyitlFJ4GiMJrZR+pzfZEPx3af1KkST4WekT5skbWGworCgujXNIQGx8dpV3tiHUAlZQOCCKAAAA0AMAnQEqGAAKAD8RcLBQLCYkorAIAYAiCWcAA+PBxZg2UzsGP31gAPa447veANNT5cQisKOv9+e12sviQTGbEDPlVSELy3hBRp46rPNVK5z/VTc7dHgtKuY1eUiQGgczoLUw7w+l5fTIPwfdDVJ3n6WfKSIoK2Sl5tHkpUhpjx+W5tBCsKC9usAA";

export interface EmptyStateProps {
  size?: Size;
  description?: string;
}

export function EmptyState({ size = "md", description }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-4 text-contentTertiary-light dark:text-contentSecondary-dark dark:opacity-30",
        {
          "text-sm": size === "sm",
          "text-base": size !== "sm",
        }
      )}
    >
      <Image
        src={emptyImage}
        placeholder="blur"
        blurDataURL={EMPTY_IMAGE_PREVIEW}
        decoding="sync"
        alt="Empty Icon"
        width={330}
        height={150}
        sizes="(max-width: 768px) 120px, (max-width: 1024px) 200px, 250px"
        className={cn("opacity-50 dark:opacity-100", {
          "h-[70px] w-[150px]": size === "sm",
          "h-[150px] w-[150px] sm:h-[100px] sm:w-[200px]": size === "md",
          "h-[100px] w-[200px] lg:h-[150px] lg:w-[330px]": size === "lg",
        })}
        preload
      />
      <p>{description ?? "No Data Available"}</p>
    </div>
  );
}
