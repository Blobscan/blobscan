type FieldProps = {
  label: string;
  value: string | number;
};

export const Field: React.FC<FieldProps> = ({ label, value }) => {
  return (
    <div className="flex w-full space-x-20 md:w-auto">
      <div className="font-bold text-primary-300 dark:text-neutral-760">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
};
