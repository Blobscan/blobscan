type SurfaceCardBaseProps = {
  children: React.ReactNode;
};

export const SurfaceCardBase: React.FC<SurfaceCardBaseProps> = function ({
  children,
}) {
  return (
    <div
      className={`
    w-full
    overflow-hidden
    text-ellipsis
    rounded-t-lg
    border
    border-border-light
    dark:border-border-dark
    dark:bg-neutral-850 

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
