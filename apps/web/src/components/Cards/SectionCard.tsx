import { type ReactNode } from "react";

type SectionCardProps = {
  header?: ReactNode;
  children: ReactNode;
};

export const SectionCard: React.FC<SectionCardProps> = function ({
  children,
  header,
}) {
  return (
    <div
      className={`
    w-full 
    overflow-hidden 
    rounded-lg
    border 
    border-surface-light
    bg-surface-light  
    p-6
    dark:border-surface-dark
    dark:bg-surface-dark
    `}
    >
      {header && (
        <div className="text-xl font-bold dark:text-warmGray-50">{header}</div>
      )}
      <div className="mt-5">
        {children}
        {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
      </div>
    </div>
  );
};
