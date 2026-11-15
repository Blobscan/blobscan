import { useId } from "react";

import { ShadedBlobBody } from "./ShadedBlobBody";
import styles from "./UnexpectedErrorBlob.module.css";

export function UnexpectedErrorBlob() {
  const id = `unexpected-blob-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 180 168"
      aria-hidden="true"
      className={`${styles.scene} h-auto w-full overflow-visible`}
    >
      <defs>
        <linearGradient id={`${id}-fire`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ef784a" />
          <stop offset=".55" stopColor="#ffb449" />
          <stop offset="1" stopColor="#ffe28c" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#ffb640" stopOpacity=".3" />
          <stop offset="1" stopColor="#ff9838" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-fire-clip`}>
          <use href={`#${id}-flame-shape`} />
        </clipPath>
      </defs>
      <ellipse
        className={styles.glow}
        cx="90"
        cy="48"
        rx="125"
        ry="49"
        fill={`url(#${id}-glow)`}
      />
      <g>
        <path
          id={`${id}-flame-shape`}
          className={styles.flame}
          d="M-26 81C-35 69-26 57-22 47C-23 57-17 60-13 52C-8 40-17 28-5 16C-7 30 7 35 5 48C3 57 12 60 17 48C22 36 17 29 26 21C24 38 36 40 33 54C31 61 39 61 43 52C48 41 38 24 51 7C49 24 65 32 60 46C57 56 66 59 73 47C82 32 71 20 84 11C80 28 94 34 91 49C90 58 100 58 104 46C108 33 100 24 109 17C108 31 121 35 117 49C115 58 126 58 131 45C136 31 123 18 138 2C131 20 149 22 147 37C145 48 139 52 147 57C155 60 164 43 161 31C172 39 172 51 169 58C177 62 184 46 180 36C193 44 192 55 189 61C198 65 203 53 202 46C216 59 212 73 205 81C163 88 18 89-26 81Z"
          fill={`url(#${id}-fire)`}
        />
        <path
          clipPath={`url(#${id}-fire-clip)`}
          className={styles.fireCore}
          d="M-22 79C-19 70-11 69-9 59C-5 68 1 73 10 70C18 67 22 59 23 51C31 61 28 71 40 73C52 74 56 59 55 49C62 57 63 70 75 72C87 74 92 63 94 55C101 64 104 73 115 71C127 69 132 55 132 47C140 59 135 70 149 72C162 73 172 63 173 56C179 67 183 74 192 70C197 68 201 65 203 60L204 80C147 86 32 87-22 79Z"
          fill="#fff0ac"
          opacity=".8"
        />
      </g>
      <g fill="#ffc865">
        {[
          [4, 28],
          [48, 18],
          [86, 24],
          [139, 13],
          [185, 38],
        ].map(([x, y], index) => (
          <g key={index} transform={`translate(${x} ${y})`}>
            <ellipse
              className={styles.ember}
              rx=".7"
              ry="1.5"
              style={{ animationDelay: `${index * -0.53}s` }}
            />
          </g>
        ))}
      </g>
      <g
        fill="none"
        stroke="#80659f"
        strokeWidth=".8"
        strokeLinecap="round"
        opacity=".55"
      >
        <path d="M-25 136Q-15 126 21 124M158 124Q198 126 211 138M-25 146Q-8 161 34 162M151 164Q191 161 211 149M58 165Q98 170 132 165" />
        <path d="M9 144L23 146M162 146L178 144M45 154L55 155M128 156L139 155" />
      </g>
      <g
        stroke="#634883"
        strokeWidth=".8"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <g transform="translate(-17 115) rotate(-12)">
          <path d="M0 0H24V28H0Z" fill="#a58cbb" />
          <path d="M3 3H21V23H3Z" fill="#554464" />
          <path
            d="M13 3L10 11L17 15L12 23M10 11L3 15M17 15L21 12"
            fill="none"
            stroke="#c9b4de"
          />
          <path d="M10 26H15" stroke="#dfcdef" />
        </g>
        <g fill="#aa92c0">
          <path d="M20 146L31 138L44 143L40 153L27 156Z" />
          <path d="M20 146L31 149L44 143M31 149L27 156" fill="none" />
          <path d="M167 115L181 111L193 120L189 131L174 133L167 125Z" />
          <path
            d="M167 115L178 123L193 120M178 123L174 133M181 112L178 117L183 120"
            fill="none"
          />
          <path d="M152 151L164 144L178 149L174 159L160 161Z" />
          <path d="M152 151L164 154L178 149M164 154L160 161" fill="none" />
        </g>
        <g transform="translate(184 143) rotate(12)">
          <path d="M0 0H18V5L14 7L17 10L13 14H0Z" fill="#8c75a6" />
          <rect x="5" y="4" width="6" height="6" rx=".5" fill="#51415f" />
          <path
            d="M2 3H3V7H5M11 6H15V2M8 10V12H13M2 11V9H5"
            fill="none"
            stroke="#d5b6dd"
            strokeWidth=".6"
          />
        </g>
        <g transform="translate(61 146) rotate(-9)">
          <path d="M0 0L17 2L23 10L8 14L2 10Z" fill="#a58cbb" />
          <path d="M0 0L6 8L23 10L17 2Z" fill="#c5b3d6" />
          <path d="M6 8L8 14" fill="none" />
          <path d="M9 4H11M16 6H18" />
        </g>
        <g transform="translate(27 119) rotate(14)">
          <path d="M0 0H17L14 4H5V11H0Z" fill="#bca8d1" />
          <path d="M0 0L3 3H14M3 3V10" fill="none" />
          <circle cx="9" cy="1.7" r=".7" fill="#634883" stroke="none" />
        </g>
        <g transform="translate(151 132) rotate(-18)">
          <path d="M0 0H10V7H0Z" fill="#8c75a6" />
          <path d="M2 2H8V5H2Z" fill="#554464" />
          <path d="M2 0V-2M5 0V-2M8 0V-2M2 7V9M5 7V9M8 7V9" />
        </g>
        <g fill="#bca8d1">
          <path d="M12 137L17 133L21 139L17 142Z" />
          <path d="M44 132L49 128L54 134L48 136Z" />
          <path d="M91 166L96 162L102 167L96 170Z" />
          <path d="M91 166L96 167L102 167M96 167V170" fill="none" />
        </g>
        <path
          d="M94 155C103 150 103 162 113 159C121 157 118 150 127 151L140 156"
          fill="none"
          strokeWidth="2"
        />
        <path
          d="M94 154.5C103 149.5 103 161.5 113 158.5C121 156.5 118 149.5 127 150.5L140 155.5"
          fill="none"
          stroke="#bda4d3"
          strokeWidth=".6"
        />
        <rect x="139" y="153" width="7" height="5" rx="1" fill="#a58cbb" />
        <path d="M146 154H149M146 157H149" />
        {[
          [8, 154],
          [49, 161],
          [186, 164],
        ].map(([x, y], index) => (
          <g key={index} transform={`translate(${x} ${y}) rotate(-20)`}>
            <path d="M0-1H5V1H0" fill="#bca8d1" />
            <path d="M-2-2H0L1 0L0 2H-2L-3 0Z" fill="#cdbbdd" />
            <path d="M-2 0H0" />
          </g>
        ))}
      </g>
      <g className={styles.body}>
        <g transform="translate(24 9) scale(.106)">
          <ShadedBlobBody />
          <g className={styles.openEyes} fill="#512080">
            <ellipse cx="588" cy="736" rx="28" ry="45" />
            <ellipse cx="773" cy="736" rx="28" ry="45" />
          </g>
          <g
            className={styles.xEyes}
            fill="none"
            stroke="#512080"
            strokeWidth="10"
            strokeLinecap="round"
          >
            <path d="M556 702L619 770M619 702L556 770M741 702L804 770M804 702L741 770" />
          </g>
        </g>
      </g>
      <g className={styles.ghost}>
        <g transform="translate(24 9) scale(.106)">
          <g className={styles.ghostBody}>
            <ShadedBlobBody />
          </g>
          <path
            d="M556 702L619 770M619 702L556 770M741 702L804 770M804 702L741 770"
            fill="none"
            stroke="#a38abf"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
