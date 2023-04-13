type SurfaceCardBaseProps = {
  children: React.ReactNode;
};

export const SurfaceCardBase: React.FC<SurfaceCardBaseProps> = function ({
  children,
}) {
  return (
    <div
      className={`
    dark:bg-neutral-850
    border-border-light
    dark:border-border-dark
    w-full 
    overflow-hidden
    rounded-lg  
    border 
    `}
    >
      {children}
    </div>
  );
};
