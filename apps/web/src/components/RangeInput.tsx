import { Input } from "./Input";

export type NumberRange = [bigint | undefined, bigint | undefined];

export type RangeInputProps = {
  value: NumberRange;
  error?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  onChange: (range: NumberRange) => void;
};

export const RangeInput: React.FC<RangeInputProps> = ({
  value,
  error,
  startPlaceholder,
  endPlaceholder,
  onChange,
}) => {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = BigInt(e.target.value) || undefined;
    const newRange = [newStart, value[1]] as NumberRange;
    onChange(newRange);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = BigInt(e.target.value) || undefined;
    const newRange = [value[0], newEnd] as NumberRange;
    onChange(newRange);
  };

  return (
    <div className="flex flex-col">
      <div className="range-input flex flex-row">
        <Input
          placeholder={startPlaceholder}
          className="h-[42px]"
          value={value[0]?.toString()}
          type="number"
          onChange={handleStartChange}
        />
        <Input
          placeholder={endPlaceholder}
          className="h-[42px]"
          value={value[1]?.toString()}
          type="number"
          onChange={handleEndChange}
        />
      </div>
      {error && error.length > 0 && (
        <span className="dark:text-error-30 ml-2 mt-1 text-xs text-error-600 dark:text-error-300">
          {error}
        </span>
      )}
    </div>
  );
};
