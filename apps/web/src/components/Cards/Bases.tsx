import { type FC, type ReactNode } from "react";

type CardTitleBaseProps = {
  children: ReactNode;
  type?: "header" | "footer";
};

export const CardTitleBase: FC<CardTitleBaseProps> = function ({
  children,
  type = "header",
}) {
  const isHeader = type === "header";
  return (
    <div
      className={`
        ${isHeader ? "rounded-t-md" : "rounded-b-md"}
        ${isHeader ? "-mx-4" : "-mx-6"}
        ${type === "header" ? "-mt-4" : "-mb-6"}
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
