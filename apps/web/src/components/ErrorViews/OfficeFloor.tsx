import { useId } from "react";

export function OfficeFloor() {
  const id = `office-floor-${useId().replace(/:/g, "")}`;
  function point(column: number, row: number) {
    const depth = row / 4;
    const scale = 1 / (1 - depth / 6);
    return `${99.5 + (column - 3) * 37.5 * scale} ${
      70 + (79 / 1.2) * depth * scale
    }`;
  }
  const tileLines = [
    ...Array.from(
      { length: 7 },
      (_, column) => `M${point(column, 0)}L${point(column, 4)}`
    ),
    ...Array.from(
      { length: 5 },
      (_, row) => `M${point(0, row)}L${point(6, row)}`
    ),
  ].join(" ");
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-surface`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#8b77a7" stopOpacity=".08" />
          <stop offset=".55" stopColor="#a995c1" stopOpacity=".18" />
          <stop offset="1" stopColor="#a995c1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-seams`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#8c76a7" stopOpacity=".12" />
          <stop offset=".5" stopColor="#8c76a7" stopOpacity=".35" />
          <stop offset="1" stopColor="#8c76a7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#41275d" stopOpacity=".2" />
          <stop offset="1" stopColor="#41275d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d={`M${point(0, 0)}L${point(6, 0)}L${point(6, 4)}L${point(0, 4)}Z`}
        fill={`url(#${id}-surface)`}
      />
      <path
        d={tileLines}
        fill="none"
        stroke={`url(#${id}-seams)`}
        strokeWidth=".65"
      />
      <ellipse cx="103" cy="127" rx="53" ry="8" fill={`url(#${id}-shadow)`} />
      <ellipse cx="48" cy="129" rx="25" ry="4" fill={`url(#${id}-shadow)`} />
    </g>
  );
}
