import type { NumberRange } from "~/components/RangeInput";

export const validateRange = (
  range: NumberRange,
  minValue: bigint,
  maxValue: bigint
): string => {
  const [leftRange, rightRange] = range;

  if (leftRange && leftRange < minValue) {
    return `Left range must be greater than or equal to ${minValue}.`;
  }

  if (rightRange && rightRange < minValue) {
    return `Right range must be greater than ${minValue}.`;
  }

  if (rightRange && rightRange > maxValue) {
    return `Right range must be less than or equal to ${maxValue}.`;
  }

  if (leftRange && leftRange > maxValue) {
    return `Left range must be less than ${maxValue}.`;
  }

  if (leftRange && rightRange && leftRange >= rightRange) {
    return "The right-hand range cannot be less or equal to the left-hand range";
  }

  return "";
};
