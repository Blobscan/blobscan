import { expect } from "vitest";

export async function expectValidError<T extends Error>(
  failingOperation: () => Promise<unknown> | unknown,
  ErrorClass: new (...args: any[]) => T,
  {
    checkMessage = true,
    checkCause = false,
  }: {
    checkMessage?: boolean;
    checkCause?: boolean;
  } = {}
) {
  try {
    await failingOperation();
  } catch (e) {
    const e_ = e as T;
    expect(e_, "Error class mismatch").instanceOf(ErrorClass);
    if (checkMessage) {
      expect(e_.message, `Error message mistmach`).toMatchSnapshot();
    }

    if (checkCause) {
      expect(e_.cause, `Error cause should exists`).toBeDefined();
      expect(e_.cause, `Error cause mismatch`).toMatchSnapshot();
    }
    expect(e);
  }
}
