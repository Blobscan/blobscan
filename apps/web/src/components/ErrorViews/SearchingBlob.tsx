import { useId } from "react";

import minerImage from "../../../public/searching-blob-helmet.webp";
import { IllustrationBackground } from "./IllustrationBackground";
import { IllustrationGround } from "./IllustrationGround";
import styles from "./SearchingBlob.module.css";
import { ShadedBlobBody } from "./ShadedBlobBody";

export function SearchingBlob() {
  const id = `searching-blob-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 180 168"
      aria-hidden="true"
      className={`${styles.scene} h-auto w-full overflow-visible text-accent-light dark:text-accent-dark`}
    >
      <defs>
        <filter
          id={`${id}-shadow-soften`}
          x="-10%"
          y="-30%"
          width="120%"
          height="160%"
        >
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <image
          id={`${id}-art`}
          href={minerImage.src}
          width="1280"
          height="1280"
        />
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d6c2f6" />
          <stop offset=".6" stopColor="#c9afea" />
          <stop offset="1" stopColor="#e2c9ed" />
        </linearGradient>
        <linearGradient id={`${id}-helmet-shadow`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#432454" stopOpacity=".45" />
          <stop offset="1" stopColor="#432454" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-helmet`}>
          <path d="M266 573C262 544 288 515 303 501C332 398 384 321 452 276C515 216 638 221 704 277C801 296 863 389 878 484C926 506 943 548 929 577L917 594C827 531 679 504 556 520C435 531 350 570 303 620C281 609 270 595 266 573Z" />
        </clipPath>
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
        <radialGradient id={`${id}-warm-glow`}>
          <stop stopColor="#fffbd2" stopOpacity=".9" />
          <stop
            offset=".4"
            stopColor="var(--halo-color)"
            stopOpacity="var(--halo-opacity)"
          />
          <stop offset="1" stopColor="#ffc637" stopOpacity="0" />
        </radialGradient>
      </defs>
      <IllustrationGround softShadow shaded wide />
      <IllustrationBackground variant="ruins" />
      <g transform="translate(26 4) scale(.106)">
        <ShadedBlobBody />
        <path
          d="M303 610C439 513 688 470 917 584C873 621 825 622 761 598C608 546 451 586 336 650Z"
          fill={`url(#${id}-helmet-shadow)`}
          filter={`url(#${id}-shadow-soften)`}
        />
        <g className={styles.eyes} fill="#512080">
          <ellipse
            cx="678"
            cy="753"
            rx="36"
            ry="68"
            transform="rotate(5 678 753)"
          />
          <ellipse
            cx="817"
            cy="722"
            rx="34"
            ry="60"
            transform="rotate(6 817 722)"
          />
          <ellipse
            cx="669"
            cy="728"
            rx="8"
            ry="23"
            fill="#f5eaff"
            transform="rotate(8 669 728)"
          />
          <ellipse
            cx="809"
            cy="699"
            rx="7"
            ry="20"
            fill="#f5eaff"
            transform="rotate(8 809 699)"
          />
        </g>
        <use href={`#${id}-art`} clipPath={`url(#${id}-helmet)`} />
      </g>
      <g transform="translate(137 94)">
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
              fill={`url(#${id}-body)`}
              stroke="#512080"
              strokeWidth="12"
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
