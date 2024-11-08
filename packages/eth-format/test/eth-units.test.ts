import { expect, describe, test } from "vitest";

import {
  convertWei,
  shiftDecimal,
  formatWei,
  countIntegerDigits,
} from "../index";

test("converts wei", () => {
  expect(convertWei(BigInt("1"), "wei")).toBe("1");
  expect(convertWei(BigInt("2"), "wei")).toBe("2");
  expect(convertWei(BigInt("123"), "wei")).toBe("123");
});

test("converts negative wei", () => {
  expect(convertWei(BigInt("-1"), "wei")).toBe("-1");
  expect(convertWei(BigInt("-2"), "wei")).toBe("-2");
  expect(convertWei(BigInt("-123"), "wei")).toBe("-123");
});

test("converts gwei", () => {
  expect(convertWei(BigInt("1"), "Gwei")).toBe("0.000000001");
  expect(convertWei(BigInt("2"), "Gwei")).toBe("0.000000002");
  expect(convertWei(BigInt("123"), "Gwei")).toBe("0.000000123");
});

test("converts negative gwei", () => {
  expect(convertWei(BigInt("-1"), "Gwei")).toBe("-0.000000001");
  expect(convertWei(BigInt("-2"), "Gwei")).toBe("-0.000000002");
  expect(convertWei(BigInt("-123"), "Gwei")).toBe("-0.000000123");
});

test("converts ether", () => {
  expect(convertWei(BigInt("1"), "ether")).toBe("0.000000000000000001");
  expect(convertWei(BigInt("2"), "ether")).toBe("0.000000000000000002");
  expect(convertWei(BigInt("123"), "ether")).toBe("0.000000000000000123");

  expect(convertWei(BigInt("1000000000000000000"), "ether")).toBe("1");
  expect(convertWei(BigInt("2000000000000000000"), "ether")).toBe("2");
  expect(convertWei(BigInt("123000000000000000000"), "ether")).toBe("123");

  expect(
    convertWei(BigInt("123123123123123123000000000000000000"), "ether")
  ).toBe("123123123123123123");

  expect(convertWei(BigInt("1000000000000000000"), "Gwei")).toBe("1000000000");
  expect(convertWei(BigInt("123000000000000000000"), "Gwei")).toBe(
    "123000000000"
  );
});

test("converts negative ether", () => {
  expect(convertWei(BigInt("-1"), "ether")).toBe("-0.000000000000000001");
  expect(convertWei(BigInt("-2"), "ether")).toBe("-0.000000000000000002");
  expect(convertWei(BigInt("-123"), "ether")).toBe("-0.000000000000000123");

  expect(convertWei(BigInt("-1000000000000000000"), "ether")).toBe("-1");
  expect(convertWei(BigInt("-2000000000000000000"), "ether")).toBe("-2");
  expect(convertWei(BigInt("-123000000000000000000"), "ether")).toBe("-123");

  expect(
    convertWei(BigInt("-123123123123123123000000000000000000"), "ether")
  ).toBe("-123123123123123123");

  expect(convertWei(BigInt("-1000000000000000000"), "Gwei")).toBe(
    "-1000000000"
  );
  expect(convertWei(BigInt("-123000000000000000000"), "Gwei")).toBe(
    "-123000000000"
  );
});

test("can move decimal point to any position", () => {
  expect(shiftDecimal(BigInt("1"), 0)).toBe("1");
  expect(shiftDecimal(BigInt("10"), 1)).toBe("1");
  expect(shiftDecimal(BigInt("100"), 2)).toBe("1");

  expect(shiftDecimal(BigInt("100"), 3)).toBe("0.1");
  expect(shiftDecimal(BigInt("100"), 4)).toBe("0.01");
  expect(shiftDecimal(BigInt("100"), 5)).toBe("0.001");
  expect(shiftDecimal(BigInt("100100"), 5)).toBe("1.001");

  expect(shiftDecimal(BigInt("11"), 1)).toBe("1.1");

  expect(shiftDecimal(BigInt("1000000000000000000"), 18)).toBe("1");
  expect(shiftDecimal(BigInt("1000000000000000001"), 18)).toBe(
    "1.000000000000000001"
  );
  expect(shiftDecimal(BigInt("1000000000000000010"), 18)).toBe(
    "1.00000000000000001"
  );

  expect(shiftDecimal(BigInt("1000000000000000000"), 0)).toBe(
    "1000000000000000000"
  );

  expect(shiftDecimal(BigInt("1000000000000000000"), 9)).toBe("1000000000");
  expect(shiftDecimal(BigInt("42"), 0)).toBe("42");
  expect(shiftDecimal(BigInt("42"), 1)).toBe("4.2");
  expect(shiftDecimal(BigInt("42"), 2)).toBe("0.42");
  expect(shiftDecimal(BigInt("42"), 3)).toBe("0.042");
  expect(shiftDecimal(BigInt("0"), 0)).toBe("0");
  expect(shiftDecimal(BigInt("123456789"), 1)).toBe("12345678.9");
});

test("negative values", () => {
  expect(shiftDecimal(BigInt("-1"), 0)).toBe("-1");
  expect(shiftDecimal(BigInt("-1"), 1)).toBe("-0.1");
  expect(shiftDecimal(BigInt("-1"), 2)).toBe("-0.01");
  expect(shiftDecimal(BigInt("-123"), 0)).toBe("-123");
  expect(shiftDecimal(BigInt("-123"), 1)).toBe("-12.3");
  expect(shiftDecimal(BigInt("-123"), 2)).toBe("-1.23");
});

test("can format wei", () => {
  expect(formatWei(BigInt("1"), { toUnit: "wei" })).toBe("1 wei");
  expect(formatWei(BigInt("2"), { toUnit: "wei" })).toBe("2 wei");
  expect(formatWei(BigInt("123"), { toUnit: "wei" })).toBe("123 wei");
  expect(formatWei(BigInt("1234"), { toUnit: "wei" })).toBe("1,234 wei");
  expect(formatWei(BigInt("123456"), { toUnit: "wei" })).toBe("123,456 wei");
  expect(formatWei(BigInt("1234567"), { toUnit: "wei" })).toBe("1,234,567 wei");
  expect(formatWei(BigInt("12345678"), { toUnit: "wei" })).toBe(
    "12,345,678 wei"
  );
  expect(formatWei(BigInt("123456789"), { toUnit: "wei" })).toBe(
    "123,456,789 wei"
  );
  expect(formatWei(BigInt("1234567890"), { toUnit: "wei" })).toBe(
    "1,234,567,890 wei"
  );
});

test("can format negative wei", () => {
  expect(formatWei(BigInt("-1"), { toUnit: "wei" })).toBe("-1 wei");
  expect(formatWei(BigInt("-2"), { toUnit: "wei" })).toBe("-2 wei");
  expect(formatWei(BigInt("-123"), { toUnit: "wei" })).toBe("-123 wei");
  expect(formatWei(BigInt("-1234"), { toUnit: "wei" })).toBe("-1,234 wei");
  expect(formatWei(BigInt("-123456"), { toUnit: "wei" })).toBe("-123,456 wei");
  expect(formatWei(BigInt("-1234567"), { toUnit: "wei" })).toBe(
    "-1,234,567 wei"
  );
  expect(formatWei(BigInt("-12345678"), { toUnit: "wei" })).toBe(
    "-12,345,678 wei"
  );
  expect(formatWei(BigInt("-123456789"), { toUnit: "wei" })).toBe(
    "-123,456,789 wei"
  );
  expect(formatWei(BigInt("-1234567890"), { toUnit: "wei" })).toBe(
    "-1,234,567,890 wei"
  );
});

test("can format gwei", () => {
  expect(formatWei(BigInt("1"), { toUnit: "Gwei" })).toBe("0.000000001 Gwei");
  expect(formatWei(BigInt("2"), { toUnit: "Gwei" })).toBe("0.000000002 Gwei");
  expect(formatWei(BigInt("123"), { toUnit: "Gwei" })).toBe("0.000000123 Gwei");
  expect(formatWei(BigInt("1234"), { toUnit: "Gwei" })).toBe(
    "0.000001234 Gwei"
  );
  expect(formatWei(BigInt("12345"), { toUnit: "Gwei" })).toBe(
    "0.000012345 Gwei"
  );
  expect(formatWei(BigInt("123456"), { toUnit: "Gwei" })).toBe(
    "0.000123456 Gwei"
  );
  expect(formatWei(BigInt("1234567"), { toUnit: "Gwei" })).toBe(
    "0.001234567 Gwei"
  );
  expect(formatWei(BigInt("12345678"), { toUnit: "Gwei" })).toBe(
    "0.012345678 Gwei"
  );
  expect(formatWei(BigInt("123456789"), { toUnit: "Gwei" })).toBe(
    "0.123456789 Gwei"
  );
  expect(formatWei(BigInt("1234567890"), { toUnit: "Gwei" })).toBe(
    "1.23456789 Gwei"
  );
  expect(formatWei(BigInt("12345678901"), { toUnit: "Gwei" })).toBe(
    "12.345678901 Gwei"
  );
  expect(formatWei(BigInt("123456789012"), { toUnit: "Gwei" })).toBe(
    "123.456789012 Gwei"
  );
  expect(formatWei(BigInt("1234567890123"), { toUnit: "Gwei" })).toBe(
    "1,234.567890123 Gwei"
  );
  expect(formatWei(BigInt("12345678901234"), { toUnit: "Gwei" })).toBe(
    "12,345.678901234 Gwei"
  );
  expect(formatWei(BigInt("123456789012345"), { toUnit: "Gwei" })).toBe(
    "123,456.789012345 Gwei"
  );
  expect(formatWei(BigInt("1234567890123456"), { toUnit: "Gwei" })).toBe(
    "1,234,567.890123456 Gwei"
  );
});

test("can format negative gwei", () => {
  expect(formatWei(BigInt("-1"), { toUnit: "Gwei" })).toBe("-0.000000001 Gwei");
  expect(formatWei(BigInt("-2"), { toUnit: "Gwei" })).toBe("-0.000000002 Gwei");
  expect(formatWei(BigInt("-123"), { toUnit: "Gwei" })).toBe(
    "-0.000000123 Gwei"
  );
  expect(formatWei(BigInt("-1234"), { toUnit: "Gwei" })).toBe(
    "-0.000001234 Gwei"
  );
  expect(formatWei(BigInt("-12345"), { toUnit: "Gwei" })).toBe(
    "-0.000012345 Gwei"
  );
  expect(formatWei(BigInt("-123456"), { toUnit: "Gwei" })).toBe(
    "-0.000123456 Gwei"
  );
  expect(formatWei(BigInt("-1234567"), { toUnit: "Gwei" })).toBe(
    "-0.001234567 Gwei"
  );
  expect(formatWei(BigInt("-12345678"), { toUnit: "Gwei" })).toBe(
    "-0.012345678 Gwei"
  );
  expect(formatWei(BigInt("-123456789"), { toUnit: "Gwei" })).toBe(
    "-0.123456789 Gwei"
  );
  expect(formatWei(BigInt("-1234567890"), { toUnit: "Gwei" })).toBe(
    "-1.23456789 Gwei"
  );
  expect(formatWei(BigInt("-12345678901"), { toUnit: "Gwei" })).toBe(
    "-12.345678901 Gwei"
  );
  expect(formatWei(BigInt("-123456789012"), { toUnit: "Gwei" })).toBe(
    "-123.456789012 Gwei"
  );
  expect(formatWei(BigInt("-1234567890123"), { toUnit: "Gwei" })).toBe(
    "-1,234.567890123 Gwei"
  );
  expect(formatWei(BigInt("-12345678901234"), { toUnit: "Gwei" })).toBe(
    "-12,345.678901234 Gwei"
  );
  expect(formatWei(BigInt("-123456789012345"), { toUnit: "Gwei" })).toBe(
    "-123,456.789012345 Gwei"
  );
  expect(formatWei(BigInt("-1234567890123456"), { toUnit: "Gwei" })).toBe(
    "-1,234,567.890123456 Gwei"
  );
});

test("can format ether", () => {
  expect(formatWei(BigInt("1"), { toUnit: "ether" })).toBe(
    "0.000000000000000001 ether"
  );
  expect(formatWei(BigInt("2"), { toUnit: "ether" })).toBe(
    "0.000000000000000002 ether"
  );
  expect(formatWei(BigInt("123"), { toUnit: "ether" })).toBe(
    "0.000000000000000123 ether"
  );
  expect(formatWei(BigInt("1234"), { toUnit: "ether" })).toBe(
    "0.000000000000001234 ether"
  );
  expect(formatWei(BigInt("12345"), { toUnit: "ether" })).toBe(
    "0.000000000000012345 ether"
  );
  expect(formatWei(BigInt("123456"), { toUnit: "ether" })).toBe(
    "0.000000000000123456 ether"
  );
  expect(formatWei(BigInt("1234567"), { toUnit: "ether" })).toBe(
    "0.000000000001234567 ether"
  );
  expect(formatWei(BigInt("12345678"), { toUnit: "ether" })).toBe(
    "0.000000000012345678 ether"
  );
  expect(formatWei(BigInt("123456789"), { toUnit: "ether" })).toBe(
    "0.000000000123456789 ether"
  );
  expect(formatWei(BigInt("1234567890"), { toUnit: "ether" })).toBe(
    "0.00000000123456789 ether"
  );
  expect(formatWei(BigInt("12345678901"), { toUnit: "ether" })).toBe(
    "0.000000012345678901 ether"
  );
  expect(formatWei(BigInt("123456789012"), { toUnit: "ether" })).toBe(
    "0.000000123456789012 ether"
  );
  expect(formatWei(BigInt("1234567890123"), { toUnit: "ether" })).toBe(
    "0.000001234567890123 ether"
  );
  expect(formatWei(BigInt("12345678901234"), { toUnit: "ether" })).toBe(
    "0.000012345678901234 ether"
  );
  expect(formatWei(BigInt("123456789012345"), { toUnit: "ether" })).toBe(
    "0.000123456789012345 ether"
  );
  expect(formatWei(BigInt("1234567890123456"), { toUnit: "ether" })).toBe(
    "0.001234567890123456 ether"
  );
  expect(formatWei(BigInt("12345678901234567"), { toUnit: "ether" })).toBe(
    "0.012345678901234567 ether"
  );
  expect(formatWei(BigInt("123456789012345678"), { toUnit: "ether" })).toBe(
    "0.123456789012345678 ether"
  );
  expect(formatWei(BigInt("1234567890123456789"), { toUnit: "ether" })).toBe(
    "1.234567890123456789 ether"
  );
  expect(formatWei(BigInt("12345678901234567890"), { toUnit: "ether" })).toBe(
    "12.34567890123456789 ether"
  );
  expect(formatWei(BigInt("123456789012345678901"), { toUnit: "ether" })).toBe(
    "123.456789012345678901 ether"
  );
  expect(formatWei(BigInt("1234567890123456789012"), { toUnit: "ether" })).toBe(
    "1,234.567890123456789012 ether"
  );
  expect(
    formatWei(BigInt("12345678901234567890123"), { toUnit: "ether" })
  ).toBe("12,345.678901234567890123 ether");
  expect(
    formatWei(BigInt("123456789012345678901234"), { toUnit: "ether" })
  ).toBe("123,456.789012345678901234 ether");
  expect(
    formatWei(BigInt("1234567890123456789012345"), { toUnit: "ether" })
  ).toBe("1,234,567.890123456789012345 ether");
  expect(
    formatWei(BigInt("12345678901234567890123456"), { toUnit: "ether" })
  ).toBe("12,345,678.901234567890123456 ether");
  expect(
    formatWei(BigInt("123456789012345678901234567"), { toUnit: "ether" })
  ).toBe("123,456,789.012345678901234567 ether");
  expect(
    formatWei(BigInt("1234567890123456789012345678"), { toUnit: "ether" })
  ).toBe("1,234,567,890.123456789012345678 ether");
});

test("can format negative ether", () => {
  expect(formatWei(BigInt("-1"), { toUnit: "ether" })).toBe(
    "-0.000000000000000001 ether"
  );
  expect(formatWei(BigInt("-2"), { toUnit: "ether" })).toBe(
    "-0.000000000000000002 ether"
  );
  expect(formatWei(BigInt("-123"), { toUnit: "ether" })).toBe(
    "-0.000000000000000123 ether"
  );
  expect(formatWei(BigInt("-1234"), { toUnit: "ether" })).toBe(
    "-0.000000000000001234 ether"
  );
  expect(formatWei(BigInt("-12345"), { toUnit: "ether" })).toBe(
    "-0.000000000000012345 ether"
  );
  expect(formatWei(BigInt("-123456"), { toUnit: "ether" })).toBe(
    "-0.000000000000123456 ether"
  );
  expect(formatWei(BigInt("-1234567"), { toUnit: "ether" })).toBe(
    "-0.000000000001234567 ether"
  );
  expect(formatWei(BigInt("-12345678"), { toUnit: "ether" })).toBe(
    "-0.000000000012345678 ether"
  );
  expect(formatWei(BigInt("-123456789"), { toUnit: "ether" })).toBe(
    "-0.000000000123456789 ether"
  );
  expect(formatWei(BigInt("-1234567890"), { toUnit: "ether" })).toBe(
    "-0.00000000123456789 ether"
  );
  expect(formatWei(BigInt("-12345678901"), { toUnit: "ether" })).toBe(
    "-0.000000012345678901 ether"
  );
  expect(formatWei(BigInt("-123456789012"), { toUnit: "ether" })).toBe(
    "-0.000000123456789012 ether"
  );
  expect(formatWei(BigInt("-1234567890123"), { toUnit: "ether" })).toBe(
    "-0.000001234567890123 ether"
  );
  expect(formatWei(BigInt("-12345678901234"), { toUnit: "ether" })).toBe(
    "-0.000012345678901234 ether"
  );
  expect(formatWei(BigInt("-123456789012345"), { toUnit: "ether" })).toBe(
    "-0.000123456789012345 ether"
  );
  expect(formatWei(BigInt("-1234567890123456"), { toUnit: "ether" })).toBe(
    "-0.001234567890123456 ether"
  );
  expect(formatWei(BigInt("-12345678901234567"), { toUnit: "ether" })).toBe(
    "-0.012345678901234567 ether"
  );
  expect(formatWei(BigInt("-123456789012345678"), { toUnit: "ether" })).toBe(
    "-0.123456789012345678 ether"
  );
  expect(formatWei(BigInt("-1234567890123456789"), { toUnit: "ether" })).toBe(
    "-1.234567890123456789 ether"
  );
  expect(formatWei(BigInt("-12345678901234567890"), { toUnit: "ether" })).toBe(
    "-12.34567890123456789 ether"
  );
  expect(formatWei(BigInt("-123456789012345678901"), { toUnit: "ether" })).toBe(
    "-123.456789012345678901 ether"
  );
  expect(
    formatWei(BigInt("-1234567890123456789012"), { toUnit: "ether" })
  ).toBe("-1,234.567890123456789012 ether");
});

test("can format wei without displaying unit", () => {
  expect(formatWei(BigInt("1"), { toUnit: "wei", displayUnit: false })).toBe(
    "1"
  );
});

test("can shift string values", () => {
  expect(shiftDecimal("1", 0)).toBe("1");
  expect(shiftDecimal("10", 1)).toBe("1");
  expect(shiftDecimal("100", 2)).toBe("1");

  expect(shiftDecimal("100", 3)).toBe("0.1");
  expect(shiftDecimal("100", 4)).toBe("0.01");

  expect(shiftDecimal("11", 1)).toBe("1.1");
  expect(shiftDecimal("1000000000000000000", 18)).toBe("1");
});

test("can shift decimal string values", () => {
  expect(shiftDecimal("1.1", 0)).toBe("1.1");
  expect(shiftDecimal("1.1", 2)).toBe("0.011");

  expect(shiftDecimal("123.123", 1)).toBe("12.3123");
  expect(shiftDecimal("123.123", 2)).toBe("1.23123");
});

test("can shift negative decimal string values", () => {
  expect(shiftDecimal("-1.1", 0)).toBe("-1.1");
  expect(shiftDecimal("-1.1", 2)).toBe("-0.011");

  expect(shiftDecimal("-123.123", 1)).toBe("-12.3123");
  expect(shiftDecimal("-123.123", 2)).toBe("-1.23123");
});

describe("countIntegerDigits", () => {
  test("handles positive integers", () => {
    expect(countIntegerDigits(123)).toBe(3);
    expect(countIntegerDigits(1)).toBe(1);
    expect(countIntegerDigits(1000)).toBe(4);
  });

  test("handles negative integers", () => {
    expect(countIntegerDigits(-123)).toBe(3);
    expect(countIntegerDigits(-1)).toBe(1);
    expect(countIntegerDigits(-1000)).toBe(4);
  });

  test("handles zero", () => {
    expect(countIntegerDigits(0)).toBe(1);
  });

  test("handles decimal numbers", () => {
    expect(countIntegerDigits(123.45)).toBe(3);
    expect(countIntegerDigits(-123.45)).toBe(3);
    expect(countIntegerDigits(0.123)).toBe(1);
    expect(countIntegerDigits(-0.123)).toBe(1);
  });

  test("handles string input", () => {
    expect(countIntegerDigits("123")).toBe(3);
    expect(countIntegerDigits("-123")).toBe(3);
    expect(countIntegerDigits("123.45")).toBe(3);
    expect(countIntegerDigits("-123.45")).toBe(3);
  });

  test("handles bigint input", () => {
    expect(countIntegerDigits(BigInt("12345678901234567890"))).toBe(20);
    expect(countIntegerDigits(BigInt("-12345678901234567890"))).toBe(20);
  });

  test("handles special number values", () => {
    expect(countIntegerDigits(Infinity)).toBe(0);
    expect(countIntegerDigits(-Infinity)).toBe(0);
    expect(countIntegerDigits(NaN)).toBe(0);
  });

  test("handles edge cases", () => {
    expect(countIntegerDigits("0.0")).toBe(1);
    expect(countIntegerDigits("-0.0")).toBe(1);
    expect(countIntegerDigits(".123")).toBe(1);
    expect(countIntegerDigits("-.123")).toBe(1);
    expect(countIntegerDigits("0.123")).toBe(1);
    expect(countIntegerDigits("-0.123")).toBe(1);
  });

  test("scientific notation", () => {
    expect(countIntegerDigits("1e+0")).toBe(1);
    expect(countIntegerDigits("1e+1")).toBe(2);
    expect(countIntegerDigits("1e+2")).toBe(3);

    expect(countIntegerDigits("1e-0")).toBe(1);
    expect(countIntegerDigits("1e-1")).toBe(1);
    expect(countIntegerDigits("1e-2")).toBe(1);

    expect(countIntegerDigits("1.23e+0")).toBe(1);
    expect(countIntegerDigits("1.23e+1")).toBe(2);
    expect(countIntegerDigits("1.23e+2")).toBe(3);

    expect(countIntegerDigits("1.23e-0")).toBe(1);
    expect(countIntegerDigits("1.23e-1")).toBe(1);
    expect(countIntegerDigits("1.23e-2")).toBe(1);

    expect(countIntegerDigits("1.23123123123123123123123e+0")).toBe(1);
    expect(countIntegerDigits("1.23123123123123123123123e+1")).toBe(2);
    expect(countIntegerDigits("1.23123123123123123123123e+2")).toBe(3);

    expect(countIntegerDigits("1.23123123123123123123123e+10")).toBe(11);
    expect(countIntegerDigits("1.23123123123123123123123e+100")).toBe(101);
    expect(countIntegerDigits("1.23123123123123123123123e+200")).toBe(201);
  });
});
