type SurfaceCardBaseProps = {
  children: React.ReactNode;
  className?: string;
};

export const SurfaceCardBase: React.FC<SurfaceCardBaseProps> = function ({
  children,
  className,
}) {
  return (
    <div
      className={`
    w-full
    truncate
    rounded-md
    border
    border-border-light
    p-4
    dark:border-border-dark
    dark:bg-neutral-850
    ${className}
    `}
    >
      {children}
    </div>
  );
};

type CardHeaderBaseProps = {
  children: React.ReactNode;
};

export const CardHeaderBase: React.FC<CardHeaderBaseProps> = function ({
  children,
}) {
  return (
    <div
      className={`
        bg-surfaceHeader-light
        text-base
        font-semibold
        dark:bg-surfaceHeader-dark
        sm:p-3
      `}
    >
      {children}
    </div>
  );
};
