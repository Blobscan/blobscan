type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
};

const SIZES = {
  sm: "h-4 w-4",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xlg: "h-24 w-24",
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
      <div className="font-light text-content-light dark:text-content-dark">
        {label}
      </div>
    </div>
  );
};
