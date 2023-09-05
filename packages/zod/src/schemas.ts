import { z } from "zod";

function isUndefined(value: unknown): boolean {
  return typeof value === "undefined";
}

function isUnset(value: unknown): boolean {
  return (typeof value === "string" && !value.length) || isUndefined(value);
}

function defaultTransformer(defaultValue: unknown) {
  return (arg: unknown) => {
    return isUnset(arg) ? defaultValue : arg;
  };
}

export const toBigIntSchema = z.string().transform((value) => BigInt(value));
