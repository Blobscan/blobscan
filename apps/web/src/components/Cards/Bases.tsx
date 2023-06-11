type SurfaceCardBaseProps = {
  children: React.ReactNode;
  className?: string;
};

export const CardBase: React.FC<SurfaceCardBaseProps> = function ({
  children,
  className,
}) {
  return (
    <div
      className={`
    dark:bg-neutral-850
    truncate
    rounded-md
    border
    border-border-light
    p-4
    dark:border-border-dark
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
        -mx-4
        -mt-4
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
