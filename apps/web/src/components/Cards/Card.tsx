import { type ReactNode } from "react";

export type CardProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = function ({
  children,
  header,
  className,
}) {
  return (
    <div
      className={`
    w-full 
    rounded-lg
    border 
    border-surface-light
    bg-surface-light  
    p-6
    dark:border-surface-dark
    dark:bg-surface-dark
    ${className}
    `}
    >
      {header && (
        <div className="text-lg font-bold dark:text-warmGray-50">{header}</div>
      )}
      <div className={header ? "mt-5" : ""}>
        {children}
        {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
      </div>
    </div>
  );
};
