import { type ReactNode } from "react";

type SectionCardProps = {
  actionBtn?: ReactNode;
  children: ReactNode;
  title: string;
};

export const SectionCard: React.FC<SectionCardProps> = function ({
  actionBtn,
  title,
  children,
}) {
  return (
    <div
      className={`
    w-full 
    overflow-hidden 
    rounded-lg
    border 
    border-border-light
    bg-surface-light  
    p-6
    dark:border-border-dark
    dark:bg-surface-dark
    `}
    >
      <div className="flex justify-between">
        <div className="text-xl font-medium ">{title}</div>
        {actionBtn && <div>{actionBtn}</div>}
      </div>
      <div className="mt-5">
        {children}
        {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
      </div>
    </div>
  );
};
