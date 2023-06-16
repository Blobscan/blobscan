import { type FC, type ReactNode } from "react";

type CardTitleBaseProps = {
  children: ReactNode;
  type?: "header" | "footer";
};

export const CardTitleBase: FC<CardTitleBaseProps> = function ({
  children,
  type = "header",
}) {
  return (
    <div
      className={`
        -mx-4
        ${type === "header" ? "-mt-4" : "-mb-4"}
        bg-surfaceHeader-light
        p-3
        text-base
        font-semibold
        dark:bg-primary-900
      `}
    >
      {children}
    </div>
  );
};
