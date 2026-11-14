import { useId } from "react";

export function ShadedBlobBody() {
  const id = `shaded-blob-${useId().replace(/:/g, "")}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d6c2f6" />
          <stop offset=".6" stopColor="#c9afea" />
          <stop offset="1" stopColor="#e2c9ed" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6933b5" />
          <stop offset="1" stopColor="#8c43db" />
        </linearGradient>
      </defs>
      <path
        d="M402 533C290 627 213 750 179 891C153 1002 185 1068 278 1100C452 1161 777 1150 934 1095C1030 1061 1054 998 1025 892C985 747 918 619 836 533C754 411 508 411 402 533Z"
        fill={`url(#${id}-rim)`}
        stroke="#512080"
        strokeWidth="12"
        strokeLinejoin="round"
      />
      <path
        d="M420 545C309 637 237 760 202 896C179 990 207 1045 289 1074C457 1134 772 1124 925 1069C1008 1040 1026 986 1000 899C962 756 897 631 817 545C738 432 510 432 420 545Z"
        fill={`url(#${id}-body)`}
      />
    </g>
  );
}
