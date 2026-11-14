import { useId } from "react";

export function IllustrationBackground({
  variant,
}: {
  variant: "ruins" | "server-room";
}) {
  const stoneId = `ruin-stone-${useId().replace(/:/g, "")}`;
  return (
    <g
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth=".8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={variant === "server-room" ? 0.85 : 0.8}
      transform={
        variant === "server-room"
          ? "translate(-5 -34) scale(1.2)"
          : "translate(-5 -72) scale(1.2 1.55)"
      }
    >
      {variant === "ruins" ? (
        <g stroke="#634883" strokeWidth="1">
          <defs>
            <linearGradient id={stoneId} x1="0" y1="0" x2="1" y2=".6">
              <stop stopColor="#c9b8de" />
              <stop offset=".5" stopColor="#aa92c4" />
              <stop offset="1" stopColor="#80659f" />
            </linearGradient>
          </defs>
          <g transform="translate(30 44)" opacity=".85">
            <path d="M4 73L5 18H18L20 73Z" fill={`url(#${stoneId})`} />
            <path
              d="M1 9L0 3H10L13 6L17 2H23L22 9L18 13V18H5V13Z M1 72H23V77H1Z"
              fill={`url(#${stoneId})`}
            />
            <path
              d="M2 8H21M6 15H17M3 75H21"
              stroke="#e8dafa"
              strokeWidth=".7"
            />
            <path
              d="M8 23L7 66M12 23V48M16 23L17 66M10 3L10 8L14 11M18 35L14 40L16 45L12 51M14 40L10 39"
              strokeWidth=".55"
            />
            <path d="M5 57L9 60L8 65" strokeWidth=".45" />
          </g>
          <g transform="translate(128 64)" opacity=".85">
            <path
              d="M2 54V13H9L12 17H20V32L16 36L20 40V54Z"
              fill={`url(#${stoneId})`}
            />
            <path
              d="M0 7H7V2H15V7H22V13H0Z M0 53H23V58H0Z"
              fill={`url(#${stoneId})`}
            />
            <path
              d="M2 11H20M2 56H21M8 5H14"
              stroke="#e8dafa"
              strokeWidth=".7"
            />
            <path
              d="M3 25H19M3 39H16M10 17V25M8 25V39M12 39V52M17 18L14 21L16 25M3 45L6 47L5 51"
              strokeWidth=".55"
            />
            <path
              d="M23 56L26 52L29 56L27 59Z"
              fill={`url(#${stoneId})`}
              strokeWidth=".65"
            />
            <circle cx="5" cy="20" r=".5" fill="#634883" stroke="none" />
          </g>
          <path
            d="M6 123V71L12 67L17 72L23 69L28 74V123Z M148 123V91L154 87L160 92L169 88L174 94V123Z"
            fill={`url(#${stoneId})`}
          />
          <path
            d="M3 123H31V127H3ZM145 123H177V127H145ZM4 78H30V82H4ZM146 98H176V102H146Z"
            fill={`url(#${stoneId})`}
          />
          <path
            d="M7 80H27M149 100H173M6 125H28M148 125H174"
            stroke="#e8dafa"
            strokeWidth=".7"
            opacity=".7"
          />
          <path
            d="M10 86V118M15 86V110M23 86V118M152 106V118M158 106V117M169 106V119"
            strokeWidth=".55"
            opacity=".65"
          />
          <path d="M13 68L14 60L21 62L25 70L17 72Z" fill={`url(#${stoneId})`} />
          <path
            d="M7 72L12 74L17 72M150 92L155 95L160 92M166 90L169 94"
            strokeWidth=".65"
          />
          <path
            d="M19 84L17 92L21 98L18 105M21 98L25 97M10 111L13 115L12 120M164 103L161 109L165 114L162 120M161 109L157 110"
            strokeWidth=".55"
            opacity=".7"
          />
          <path
            d="M1 130L5 126L11 128L13 132L6 133ZM27 130L31 125L36 129L35 133ZM143 131L147 127L152 130L151 133ZM172 130L176 126L179 130L177 134Z"
            fill={`url(#${stoneId})`}
            strokeWidth=".65"
          />
          <path
            d="M5 126L7 130L13 132M31 125L31 130L35 133M176 126L176 131L177 134M7 76H10M23 116V119M167 96H170"
            strokeWidth=".45"
            opacity=".6"
          />
          <g fill="currentColor" stroke="none" opacity=".65">
            <circle cx="8" cy="90" r=".45" />
            <circle cx="25" cy="108" r=".45" />
            <circle cx="155" cy="115" r=".4" />
            <circle cx="171" cy="105" r=".4" />
          </g>
        </g>
      ) : (
        <g stroke="#634883" strokeWidth="1">
          <defs>
            <linearGradient id={`${stoneId}-rack`} x1="0" y1="0" x2="1" y2=".6">
              <stop stopColor="#c9b8de" />
              <stop offset=".5" stopColor="#aa92c4" />
              <stop offset="1" stopColor="#80659f" />
            </linearGradient>
          </defs>
          {[
            { x: 28, y: 20.4, scale: 0.8, angle: -3, opacity: 0.85 },
            { x: 128, y: 24.4, scale: 0.8, angle: 0, opacity: 0.85 },
            { x: 3, y: 30, scale: 1, angle: 0, opacity: 1 },
            { x: 143, y: 30, scale: 1, angle: 0, opacity: 1 },
          ].map(({ x, y, scale, angle, opacity }) => (
            <g
              key={x}
              transform={`translate(${x} ${y}) scale(${scale}) rotate(${angle} 15 40)`}
              opacity={opacity}
            >
              <rect
                width="29"
                height="93"
                rx="3"
                fill={`url(#${stoneId}-rack)`}
              />
              <path
                d="M3 4H26M3 89H26M2 8V85M27 8V85"
                strokeWidth=".45"
                opacity=".6"
              />
              <path d="M5 93V95H10V93M19 93V95H24V93" />
              {[0, 1, 2, 3, 4].map((row) => (
                <g key={row}>
                  <rect
                    x="4"
                    y={7 + row * 17}
                    width="21"
                    height="12"
                    rx="1.5"
                    fill="#d9c8eb"
                  />
                  <circle
                    cx="8"
                    cy={13 + row * 17}
                    r=".8"
                    fill="currentColor"
                    stroke="none"
                  />
                  <circle
                    cx="11"
                    cy={13 + row * 17}
                    r=".55"
                    fill="currentColor"
                    stroke="none"
                    opacity=".5"
                  />
                  <path
                    d={`M15 ${11 + row * 17}v4M17 ${11 + row * 17}v4M19 ${
                      11 + row * 17
                    }v4M22 ${11 + row * 17}v4`}
                    strokeWidth=".5"
                  />
                  <path
                    d={`M6 ${9 + row * 17}h3M6 ${17 + row * 17}h3`}
                    strokeWidth=".45"
                    opacity=".6"
                  />
                </g>
              ))}
              <path
                d={
                  x < 90
                    ? "M20 0L17 5L20 10L16 16M20 10L25 12M2 49L7 53L5 58L10 62"
                    : "M8 0L11 6L8 12L12 18M8 12L4 14M29 47L24 51L26 57L22 62"
                }
                stroke="#563969"
                strokeWidth=".85"
              />
              <circle cx="5" cy="3" r=".5" fill="currentColor" stroke="none" />
              <circle cx="24" cy="3" r=".5" fill="currentColor" stroke="none" />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}
