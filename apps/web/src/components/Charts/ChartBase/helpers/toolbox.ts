import type { EChartOption } from "echarts";

import { cumulativeSum } from "~/utils";

function isDataObject(
  element: unknown[]
): element is EChartOption.SeriesLine.DataObject[] {
  return element.every(
    (el) =>
      typeof el === "object" &&
      el !== null &&
      "value" in el &&
      element.every((e) => typeof e === "number")
  );
}

function isNumberArray(elements: unknown[]): elements is number[] {
  return elements.every((el) => typeof el === "number");
}

function isStringArray(elements: unknown[]): elements is string[] {
  return elements.every((el) => typeof el === "string");
}

function tryConvert(element: string[], to: "number"): number[] | undefined;
function tryConvert(element: string[], to: "bigint"): bigint[] | undefined;
function tryConvert(element: string[], to: "number" | "bigint") {
  try {
    return element.map((el) => (to === "number" ? Number(el) : BigInt(el)));
  } catch (_) {
    return;
  }
}

export function performCumulativeSum(data: unknown[]): string[] {
  let cumulativeSums;

  if (isNumberArray(data)) {
    cumulativeSums = cumulativeSum(data);
  } else if (isDataObject(data)) {
    const values = data.map(({ value }) => value);

    return performCumulativeSum(values);
  } else if (isStringArray(data)) {
    const bigNumbers = tryConvert(data, "bigint");

    if (bigNumbers) {
      cumulativeSums = cumulativeSum(bigNumbers);
    } else {
      const numbers = tryConvert(data, "number");

      if (numbers) {
        cumulativeSums = cumulativeSum(numbers);
      }
    }
  }

  if (cumulativeSums) {
    return cumulativeSums.map((sum) => sum.toString());
  }

  throw new Error("Unable to perform cumulative sum on data");
}

export function createToolBox({
  extraFeatures,
  themeMode,
  opts,
}: {
  themeMode: "light" | "dark";
  extraFeatures?: {
    cumulativeSum?: {
      onClick: () => void;
    };
  };
  opts?: EChartOption<EChartOption.Series>["toolbox"];
}): EChartOption<EChartOption.Series>["toolbox"] {
  console.log(extraFeatures);
  const cumulativeSumFeature = extraFeatures?.cumulativeSum
    ? {
        myCumulativeSum: {
          show: true,
          iconStyle: {
            borderColor: themeMode === "dark" ? "#E2CFFF" : "#5D25D4",
          },
          title: "Switch to Cumulative",
          icon: "path://M126,124h-1V16a2,2,0,0,0-2-2H113a2,2,0,0,0-2,2V124h-4V32a2,2,0,0,0-2-2H95a2,2,0,0,0-2,2v92H89V48a2,2,0,0,0-2-2H77a2,2,0,0,0-2,2v76H71V64a2,2,0,0,0-2-2H59a2,2,0,0,0-2,2v60H53V80a2,2,0,0,0-2-2H41a2,2,0,0,0-2,2v44H35V96a2,2,0,0,0-2-2H23a2,2,0,0,0-2,2v28H17V112a2,2,0,0,0-2-2H5a2,2,0,0,0-2,2v12H2a2,2,0,0,0,0,4H126a2,2,0,0,0,0-4ZM7,124V114h6v10Zm18,0V98h6v26Zm18,0V82h6v42Zm18,0V66h6v58Zm18,0V50h6v74Zm18,0V34h6v90Zm18,0V18h6V124Z M2,86a2,2,0,0,0,.49-.06c.58-.15,57.78-15.13,103.25-76.37l0,1a2,2,0,0,0,1.93,2.07h.07a2,2,0,0,0,2-1.93l.3-8.68A2,2,0,0,0,107.07.23L99.31,4.31a2,2,0,0,0,1.86,3.54l1.4-.74C58,67.21,2.08,81.92,1.51,82.06A2,2,0,0,0,2,86Z",
          onclick: extraFeatures.cumulativeSum.onClick,
        },
      }
    : {};

  return {
    iconStyle: {
      borderColor: themeMode === "dark" ? "#7D80AB" : "#171717",
    },
    emphasis: {
      iconStyle: {
        borderColor: themeMode === "dark" ? "#E2CFFF" : "#5D25D4",
      },
    },
    feature: {
      magicType: { type: ["bar", "line"] },
      dataView: { readOnly: false },
      saveAsImage: {},
      ...cumulativeSumFeature,
    },
    ...(opts ?? {}),
  };
}
