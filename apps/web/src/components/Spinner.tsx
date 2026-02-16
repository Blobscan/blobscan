type SpinnerProps = {
  size?: "sm" | "md" | "lg" | "xlg";
  label?: string;
};

const SIZES = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xlg: "h-16 w-16",
};

export const Spinner: React.FC<SpinnerProps> = function ({
  size = "md",
  label,
}) {
  return (
    <div className="flex items-center justify-center space-x-3">
      <div
        className={`${SIZES[size]} animate-spin rounded-full border-l-2 border-primary-400`}
      />
      <div className="font-light text-contentSecondary-light dark:text-contentSecondary-dark">
        {label}
      </div>
    </div>
  );
};
