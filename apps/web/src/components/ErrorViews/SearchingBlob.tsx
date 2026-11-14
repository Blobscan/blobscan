import { useId } from "react";

import blobImage from "../../../public/blob-loader.webp";
import helmetImage from "../../../public/searching-blob-helmet.webp";
import { IllustrationBackground } from "./IllustrationBackground";
import { IllustrationGround } from "./IllustrationGround";
import styles from "./SearchingBlob.module.css";

export function SearchingBlob() {
  const id = `searching-blob-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 180 168"
      aria-hidden="true"
      className="h-auto w-full text-accent-light dark:text-accent-dark"
    >
      <defs>
        <filter
          id={`${id}-thin-outline`}
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
        >
          <feMorphology operator="erode" radius=".25" />
        </filter>
        <image
          id={`${id}-miner-art`}
          href={helmetImage.src}
          width="1280"
          height="1280"
        />
        <path
          id={`${id}-helmet-contour`}
          d="M266 573 C262 544 288 515 303 501 C332 398 384 321 452 276 C515 216 638 221 704 277 C801 296 863 389 878 484 C926 506 943 548 929 577 L917 594 C827 531 679 504 556 520 C435 531 350 570 303 620 C281 609 270 595 266 573Z"
        />
        <clipPath id={`${id}-miner-hat`}>
          <path d="M266 573 C262 544 288 515 303 501 C332 398 384 321 452 276 C515 216 638 221 704 277 C801 296 863 389 878 484 C926 506 943 548 929 573 L918 581 C827 531 679 504 556 520 C435 531 350 570 303 620 C281 609 270 595 266 573Z" />
        </clipPath>

        <mask id={`${id}-new-blob`} style={{ maskType: "alpha" }}>
          <image href={blobImage.src} width="112" height="112" />
        </mask>
        <clipPath id={`${id}-blob-outline`}>
          <path
            clipRule="evenodd"
            d="M0 0H112V112H0Z M52.64 49.28V69.44H80.64V49.28Z"
          />
        </clipPath>
        <clipPath id={`${id}-blob-eyes`}>
          <rect x="52.64" y="49.28" width="28" height="20.16" />
        </clipPath>
        <radialGradient id={`${id}-warm-glow`}>
          <stop stopColor="#fffbd2" stopOpacity=".9" />
          <stop offset=".4" stopColor="#ffe37c" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffc637" stopOpacity="0" />
        </radialGradient>
        <mask
          id={`${id}-helmet-body-occlusion`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="180"
          height="168"
          style={{ maskType: "luminance" }}
        >
          <rect width="180" height="168" fill="white" />
          <use
            href={`#${id}-helmet-contour`}
            transform="translate(39.12 12.92) scale(.074 .0902)"
            fill="black"
            stroke="black"
            strokeWidth="20"
          />
        </mask>

        <linearGradient id={`${id}-lantern-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff1a0" />
          <stop offset=".45" stopColor="#f9cc58" />
          <stop offset="1" stopColor="#df9430" />
        </linearGradient>
        <linearGradient id={`${id}-lantern-glass`}>
          <stop stopColor="#e6b347" />
          <stop offset=".22" stopColor="#f9d778" />
          <stop offset=".52" stopColor="#fff3b8" />
          <stop offset=".82" stopColor="#f7d16c" />
          <stop offset="1" stopColor="#dfaa3e" />
        </linearGradient>

        <radialGradient id={`${id}-lantern-flame`}>
          <stop stopColor="#fffef0" />
          <stop offset=".6" stopColor="#fff5b1" />
          <stop offset="1" stopColor="#ffe789" stopOpacity=".3" />
        </radialGradient>
      </defs>
      <IllustrationBackground variant="ruins" />
      <IllustrationGround softShadow />
      <g mask={`url(#${id}-helmet-body-occlusion)`}>
        <g transform="translate(30 34)">
          <g
            clipPath={`url(#${id}-blob-outline)`}
            filter={`url(#${id}-thin-outline)`}
          >
            <rect
              width="112"
              height="112"
              fill="currentColor"
              mask={`url(#${id}-new-blob)`}
            />
          </g>
          <g className={styles.eyes}>
            <g clipPath={`url(#${id}-blob-eyes)`}>
              <rect
                width="112"
                height="112"
                fill="currentColor"
                mask={`url(#${id}-new-blob)`}
              />
            </g>
          </g>
        </g>
      </g>
      <g transform="translate(39.12 12.92) scale(.074 .0902)">
        <use href={`#${id}-miner-art`} clipPath={`url(#${id}-miner-hat)`} />
      </g>
      <g transform="translate(-17 8)">
        <g
          className={styles.questions}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g transform="rotate(-9 144 32)">
            <path
              d="M137 27C137 18 151 18 151 26C151 31 145 32 144 37"
              strokeWidth="2.7"
            />
            <circle
              cx="143.5"
              cy="43"
              r="1.65"
              fill="currentColor"
              stroke="none"
            />
          </g>
          <g transform="rotate(9 160 43)" opacity=".68">
            <path
              d="M155 39C155 33 165 33 165 39C165 43 160 44 160 47"
              strokeWidth="2.1"
            />
            <circle
              cx="159.7"
              cy="52"
              r="1.3"
              fill="currentColor"
              stroke="none"
            />
          </g>
        </g>
      </g>
      <g transform="translate(137 110)">
        <g className={styles.lantern}>
          <circle
            className={styles.lanternGlow}
            cx="0"
            cy="29"
            r="24"
            fill={`url(#${id}-warm-glow)`}
          />
          <g transform="scale(.12) translate(-1010 -660)">
            <path
              d="M960 783V725Q960 703 980 692M1040 691Q1060 703 1060 725V783"
              fill="none"
              stroke="#54206e"
              strokeWidth="27"
              strokeLinecap="round"
            />
            <path
              d="M960 783V725Q960 703 980 692M1040 691Q1060 703 1060 725V783"
              fill="none"
              stroke="#f5c34c"
              strokeWidth="14"
              strokeLinecap="round"
            />

            <path
              d="M964 682C943 673 945 644 967 633C992 620 1033 626 1048 646C1061 664 1052 690 1035 696C1023 700 1013 692 1015 678C1003 691 986 696 975 688C968 685 965 680 964 674"
              fill="none"
              stroke="currentColor"
              strokeWidth="17"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g stroke="#54206e" strokeWidth="1.2" strokeLinejoin="round">
            <path
              d="M-8.8 20.2C-11 25-10.8 32-8.8 37Q0 40 8.8 37C10.8 32 11 25 8.8 20.2Z"
              fill={`url(#${id}-lantern-glass)`}
            />
            <path
              d="M-7.4 22Q-9.3 29-7.4 36.5M7.4 22Q9.3 29 7.4 36.5"
              fill="none"
              stroke="#d79a32"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M-5.8 24Q-6.8 27-6.4 30"
              fill="none"
              stroke="#fff9dc"
              strokeWidth="1"
              strokeLinecap="round"
              opacity=".8"
            />
            <rect
              x="-2.6"
              y="12.5"
              width="5.2"
              height="3.5"
              rx="1.2"
              fill={`url(#${id}-lantern-gold)`}
            />
            <path
              d="M-10.5 18Q-7 14.5-2.5 14.5H2.5Q7 14.5 10.5 18L10.8 20Q0 22.8-10.8 20Z"
              fill={`url(#${id}-lantern-gold)`}
            />
            <path
              d="M-9.5 37Q0 39.5 9.5 37L11.5 40Q0 44-11.5 40Z"
              fill={`url(#${id}-lantern-gold)`}
            />
            <path
              d="M-8.5 18.3Q0 20.2 8.5 18.3M-8.5 39Q0 41 8.5 39"
              fill="none"
              stroke="#fff3b4"
              strokeWidth=".8"
              strokeLinecap="round"
            />
            <path
              d="M-10 20.2Q0 22.5 10 20.2M-9.5 40.4Q0 42.7 9.5 40.4"
              fill="none"
              stroke="#ae722c"
              strokeWidth=".65"
              opacity=".7"
            />
          </g>
          <ellipse
            cx="0"
            cy="29"
            rx="4.2"
            ry="6.2"
            fill={`url(#${id}-lantern-flame)`}
          />
          <ellipse
            className={styles.lampCore}
            cx="0"
            cy="29"
            rx="6"
            ry="8"
            fill={`url(#${id}-warm-glow)`}
          />
        </g>
      </g>
    </svg>
  );
}
