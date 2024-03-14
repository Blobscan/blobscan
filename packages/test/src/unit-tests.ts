import { expect, it } from "vitest";

export function testValidError<T extends Error>(
  name: string,
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
  it(name, async () => {
    try {
      await failingOperation();

      expect.fail("Function should have thrown error");
    } catch (e) {
      const e_ = e as T;
      expect(e_, "Error class mismatch").instanceOf(ErrorClass);

      if (checkMessage) {
        expect(e_.message, `Error message mistmach`).toMatchSnapshot();
      }

      if (checkCause) {
        expect(e_).toHaveProperty("cause");
        expect(e_.cause, `Error cause mismatch`).toMatchSnapshot();
      }
    }
  });
}
