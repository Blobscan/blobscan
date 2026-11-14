import { useId } from "react";

export function IllustrationGround({
  softShadow = false,
}: {
  softShadow?: boolean;
}) {
  const id = `illustration-ground-${useId().replace(/:/g, "")}`;
  return (
    <g aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-ground`}>
          <stop
            stopColor="currentColor"
            stopOpacity={softShadow ? 0.11 : 0.22}
          />
          <stop
            offset=".55"
            stopColor="currentColor"
            stopOpacity={softShadow ? 0.035 : 0.09}
          />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="87"
        cy="128"
        rx="73"
        ry={softShadow ? 6 : 10}
        fill={`url(#${id}-ground)`}
      />
      <path
        d="M17 127C43 133 116 134 157 126M47 135L54 136M65 138Q83 140 98 138M109 136L115 135M137 132L145 130M20 133L25 134"
        fill="none"
        stroke="currentColor"
        strokeWidth=".8"
        strokeLinecap="round"
        opacity=".22"
      />
      <path
        d="M29 132Q31 128 34 130L37 133Q33 135 29 132Z M119 134Q122 130 125 133L127 135Q123 137 119 134Z M145 128Q147 125 150 127L152 129Q149 131 145 128Z M57 139L60 137L63 140Q60 141 57 139Z"
        fill="currentColor"
        fillOpacity=".1"
        stroke="currentColor"
        strokeOpacity=".3"
        strokeWidth=".7"
        strokeLinejoin="round"
      />
      <path
        d="M19 128L17 124M19 128L22 125M140 132L140 128M140 132L143 129M72 134L76 135L79 133M76 135L75 137M99 132L103 133L106 132"
        fill="none"
        stroke="currentColor"
        strokeWidth=".65"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".28"
      />
      <g fill="currentColor" opacity=".24">
        <circle cx="42" cy="136" r=".65" />
        <circle cx="104" cy="139" r=".7" />
        <circle cx="133" cy="136" r=".55" />
        <circle cx="155" cy="133" r=".6" />
      </g>
    </g>
  );
}
