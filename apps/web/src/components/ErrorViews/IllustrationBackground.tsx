export function IllustrationBackground({
  variant,
}: {
  variant: "ruins" | "server-room";
}) {
  return (
    <g
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth=".8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={variant === "ruins" ? 0.42 : 0.3}
    >
      {variant === "ruins" ? (
        <g>
          <path
            d="M6 123V71L12 67L17 72L23 69L28 74V123Z M148 123V91L154 87L160 92L169 88L174 94V123Z"
            fill="currentColor"
            fillOpacity=".055"
          />
          <path
            d="M3 123H31V127H3ZM145 123H177V127H145ZM4 78H30V82H4ZM146 98H176V102H146Z"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path
            d="M10 86V118M15 86V110M23 86V118M152 106V118M158 106V117M169 106V119"
            strokeWidth=".55"
            opacity=".65"
          />
          <path
            d="M13 68L14 60L21 62L25 70M7 72L12 74L17 72M150 92L155 95L160 92M166 90L169 94"
            strokeWidth=".65"
          />
          <path
            d="M19 84L17 92L21 98L18 105M21 98L25 97M10 111L13 115L12 120M164 103L161 109L165 114L162 120M161 109L157 110"
            strokeWidth=".55"
            opacity=".7"
          />
          <path
            d="M1 130L5 126L11 128L13 132L6 133ZM27 130L31 125L36 129L35 133ZM143 131L147 127L152 130L151 133ZM172 130L176 126L179 130L177 134Z"
            fill="currentColor"
            fillOpacity=".08"
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
        <>
          {[0, 1].map((side) => (
            <g
              key={side}
              transform={`translate(${side ? 143 : 3} 47)${
                side ? " rotate(8 15 40)" : ""
              }`}
            >
              <rect
                width="29"
                height="76"
                rx="3"
                fill="currentColor"
                fillOpacity=".04"
              />
              <path
                d="M3 4H26M3 72H26M2 8V68M27 8V68"
                strokeWidth=".45"
                opacity=".6"
              />
              <path d="M5 76V78H10V76M19 76V78H24V76" />
              {[0, 1, 2, 3].map((row) => (
                <g key={row}>
                  <rect x="4" y={7 + row * 17} width="21" height="12" rx="1" />
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
              <circle cx="5" cy="3" r=".5" fill="currentColor" stroke="none" />
              <circle cx="24" cy="3" r=".5" fill="currentColor" stroke="none" />
            </g>
          ))}
          <path d="M140 29h4M142 27v4M173 83h4M175 81v4" />
        </>
      )}
    </g>
  );
}
