import { useId } from "react";

export function IllustrationGround({
  softShadow = false,
  shaded = false,
  wide = false,
}: {
  softShadow?: boolean;
  shaded?: boolean;
  wide?: boolean;
}) {
  const id = `illustration-ground-${useId().replace(/:/g, "")}`;
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-stone`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#c9b8de" />
          <stop offset="1" stopColor="#80659f" />
        </linearGradient>
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
      {wide && (
        <g>
          <path
            d="M-9 119Q9 109 40 111Q81 105 118 110Q166 106 202 120L215 136Q183 147 143 145Q86 152 37 144Q4 146-14 135Z"
            fill={`url(#${id}-stone)`}
            fillOpacity=".13"
          />
          <path
            d="M-9 119Q9 109 40 111M143 111Q177 109 202 120M-14 135Q4 146 37 144M143 145Q183 147 215 136M-5 129L9 131L19 128M176 137L186 139L199 135M39 145L55 147M111 148L128 147"
            fill="none"
            stroke="#80659f"
            strokeWidth=".7"
            strokeLinecap="round"
            opacity=".4"
          />
          <path
            d="M1 138L5 134L10 137L8 140ZM190 141L195 136L201 140L198 143ZM151 145L155 142L160 145L156 148Z"
            fill={`url(#${id}-stone)`}
            stroke="#634883"
            strokeWidth=".6"
            opacity=".65"
          />
          <path
            d="M22 139L26 140M171 143L176 144M61 113L67 112M199 128L203 130"
            fill="none"
            stroke="#80659f"
            strokeWidth=".7"
            strokeLinecap="round"
            opacity=".5"
          />
        </g>
      )}
      <ellipse
        cx={wide ? 100 : 87}
        cy="128"
        rx={wide ? 112 : 73}
        ry={wide ? 18 : softShadow ? 6 : 10}
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
        fill={shaded ? `url(#${id}-stone)` : "currentColor"}
        fillOpacity={shaded ? 0.65 : 0.1}
        stroke={shaded ? "#634883" : "currentColor"}
        strokeOpacity={shaded ? 0.65 : 0.3}
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
