import { useId } from "react";

import { ShadedBlobBody } from "./ErrorViews/ShadedBlobBody";

export function EmptyBlob({ className }: { className?: string }) {
  const id = `empty-blob-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 300 140" aria-hidden="true" className={className}>
      <defs>
        <filter id={`${id}-tertiary`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    -0.213 -0.715 -0.072 1 0"
            result="shading"
          />
          <feFlood floodColor="currentColor" />
          <feComposite in2="shading" operator="in" />
        </filter>
        <linearGradient id={`${id}-cabinet`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e5dcee" />
          <stop offset="1" stopColor="#a38aba" />
        </linearGradient>
        <linearGradient id={`${id}-drawer`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f0e9f7" />
          <stop offset="1" stopColor="#c5aedc" />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-tertiary)`}>
        <g
          fill="none"
          stroke="#80659f"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 122Q18 116 33 115M137 116Q149 114 160 116M264 117Q281 119 289 125M289 129Q278 134 258 133M225 135Q188 138 155 135M127 135Q91 139 58 134M39 133Q20 134 10 128" />
          <path
            d="M25 126L34 128L42 126M137 128L144 130L151 128M266 128L274 127M75 133L84 134M191 132L204 133"
            opacity=".65"
          />
          <path d="M47 130L51 126L57 130L54 133ZM228 130L233 126L239 130L235 133ZM111 134L114 131L119 134L116 136Z" />
          <path
            d="M19 130L22 131M65 127L68 128M165 133L169 134M249 135L252 134"
            opacity=".65"
          />
        </g>
        <g
          transform="translate(35 -4) scale(.8 1)"
          stroke="#634883"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path
            d="M155 15L174 5H286V115L267 125H155Z"
            fill={`url(#${id}-cabinet)`}
          />
          <path d="M155 15H267V125M267 15L286 5" fill="none" />
          <path d="M273 23V115L280 111" fill="none" opacity=".4" />
          {[21, 73, 99].map((y) => (
            <g key={y}>
              <rect
                x="161"
                y={y}
                width="100"
                height="20"
                rx="1.5"
                fill={`url(#${id}-drawer)`}
              />
              <rect
                x="196"
                y={y + 6}
                width="30"
                height="7"
                rx="1"
                fill="#f5d58b"
              />
              <path
                d={`M165 ${y + 3}H257`}
                fill="none"
                stroke="#fbf6ff"
                strokeWidth="1"
                opacity=".8"
              />
            </g>
          ))}
          <rect
            x="161"
            y="47"
            width="100"
            height="20"
            rx="1.5"
            fill="#665079"
          />
          <path d="M161 47H261L249 55H149Z" fill="#927ca7" />
          <path d="M261 47V67L249 75V55Z" fill={`url(#${id}-cabinet)`} />
          <path d="M161 47L149 55V75L161 67Z" fill={`url(#${id}-cabinet)`} />
          <path d="M165 49H254L248 53H157Z" fill="#665079" stroke="none" />
          <rect
            x="149"
            y="55"
            width="100"
            height="20"
            rx="1.5"
            fill={`url(#${id}-drawer)`}
          />
          <rect x="184" y="61" width="30" height="7" rx="1" fill="#f5d58b" />
          <path
            d="M153 58H245"
            fill="none"
            stroke="#fbf6ff"
            strokeWidth="1"
            opacity=".8"
          />
          <path d="M160 125V128H168V125M254 125V128H262V125" fill="#927ca7" />
        </g>
        <g transform="translate(10 -29) scale(.14)">
          <ShadedBlobBody />
        </g>
        <g fill="#512080" transform="translate(18 6)">
          <ellipse cx="78" cy="70" rx="4.2" ry="7.5" />
          <ellipse cx="101" cy="68" rx="4" ry="7" />
          <ellipse cx="77" cy="67" rx="1" ry="2.2" fill="#f5eaff" />
          <ellipse cx="100" cy="65" rx="1" ry="2" fill="#f5eaff" />
          <path
            d="M70 56Q76 55 79 51M98 50Q103 54 109 53"
            fill="none"
            stroke="#512080"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
