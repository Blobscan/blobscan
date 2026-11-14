import { useId } from "react";

import { IllustrationBackground } from "./IllustrationBackground";
import { OfficeFloor } from "./OfficeFloor";
import styles from "./ServerErrorBlob.module.css";
import { ShadedBlobBody } from "./ShadedBlobBody";

export function ServerErrorBlob() {
  const id = `server-error-blob-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 180 168"
      aria-hidden="true"
      className={`${styles.scene} h-auto w-full overflow-visible text-accent-light dark:text-accent-dark`}
    >
      <defs>
        <clipPath id={`${id}-rack-tops`}>
          <path d="M-10 -80H210V2H176V-4.72H148V2H56V-9.52H28V2H-10Z" />
        </clipPath>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e9e4f5" />
          <stop offset=".5" stopColor="#b0a6c9" />
          <stop offset="1" stopColor="#817695" />
        </linearGradient>
        <radialGradient id={`${id}-sweat`} cx=".3" cy=".25" r=".8">
          <stop stopColor="#c4a0f1" stopOpacity=".9" />
          <stop offset=".45" stopColor="#8043bd" stopOpacity=".8" />
          <stop offset="1" stopColor="#48206e" stopOpacity=".95" />
        </radialGradient>
        <radialGradient id={`${id}-fire-glow`}>
          <stop stopColor="#ffd076" stopOpacity=".5" />
          <stop
            offset=".45"
            stopColor="var(--halo-color)"
            stopOpacity="var(--halo-opacity)"
          />
          <stop offset="1" stopColor="#ff7845" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ee7445" />
          <stop offset=".6" stopColor="#ffa64d" />
          <stop offset="1" stopColor="#ffd77b" />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffe17a" />
          <stop offset="1" stopColor="#fff7bf" />
        </linearGradient>
        <clipPath id={`${id}-flame-silhouette`}>
          <use href={`#${id}-flame-shape`} />
        </clipPath>
        <linearGradient id={`${id}-warning-gold`} x1="0" y1="0" x2=".7" y2="1">
          <stop stopColor="#fff1aa" />
          <stop offset=".5" stopColor="#fbd46c" />
          <stop offset="1" stopColor="#e9ad42" />
        </linearGradient>
      </defs>
      <defs>
        <g id={`${id}-server-fire`}>
          <g>
            <path
              id={`${id}-flame-shape`}
              className={styles.flameTips}
              d="M60 95C55 76 55 64 63 52C62 63 70 64 70 52C69 39 65 30 73 18C74 33 87 40 83 54C81 64 90 67 94 57C98 47 96 40 103 32C102 48 116 54 114 68C121 78 118 87 116 95Z"
              fill={`url(#${id}-flame)`}
              stroke="#713749"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <g clipPath={`url(#${id}-flame-silhouette)`}>
              <path
                className={styles.innerFlame}
                d="M65 75C62 54 69 53 72 47C71 55 79 53 80 46C80 40 84 37 86 32C86 41 94 42 96 48C100 53 104 50 105 46C106 53 111 55 110 75L110 90H65Z"
                fill={`url(#${id}-core)`}
              />
            </g>
          </g>
          <g fill="#f6aa58">
            <circle className={styles.ember} cx="64" cy="43" r="1.2" />
            <circle
              className={`${styles.ember} ${styles.emberLate}`}
              cx="111"
              cy="42"
              r="1"
            />
            <circle
              className={`${styles.ember} ${styles.emberFast}`}
              cx="94"
              cy="28"
              r=".8"
            />
          </g>
        </g>
      </defs>
      <g className={styles.fireGlow} fill={`url(#${id}-fire-glow)`}>
        <ellipse cx="14" cy="-12.4" rx="29" ry="34" />
        <ellipse cx="181" cy="-12.4" rx="30" ry="35" />
      </g>
      <g clipPath={`url(#${id}-rack-tops)`}>
        <use
          href={`#${id}-server-fire`}
          transform="translate(-26.5 -41.7) scale(.46)"
        />
        <g transform="translate(137 -45.5) scale(.5)">
          <path
            className={styles.rightFlame}
            d="M65 95C61 79 66 67 77 59C87 51 91 44 83 35C73 24 79 11 94 5C85 18 88 25 99 31C113 39 112 52 102 63C97 69 100 74 105 72C111 69 114 63 113 58C123 72 116 85 112 95Z"
            fill={`url(#${id}-flame)`}
            stroke="#713749"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            className={styles.innerFlame}
            d="M76 95C70 82 77 73 86 67C94 61 97 55 94 47C106 58 96 70 96 78C103 77 107 85 104 95Z"
            fill={`url(#${id}-core)`}
          />
          <circle
            className={styles.emberLate + " " + styles.ember}
            cx="101"
            cy="30"
            r="1.1"
            fill="#f6aa58"
          />
        </g>
      </g>
      <OfficeFloor />
      <IllustrationBackground variant="server-room" />
      <g transform="translate(39 4) scale(.106)">
        <ShadedBlobBody />
      </g>
      <g className={styles.face} fill="#512080">
        <ellipse cx="94" cy="88" rx="3.8" ry="7.2" />
        <ellipse cx="111" cy="88" rx="3.8" ry="7.2" />
        <ellipse cx="93" cy="85.5" rx=".8" ry="2.1" fill="#f5eaff" />
        <ellipse cx="110" cy="85.5" rx=".8" ry="2.1" fill="#f5eaff" />
        <path
          d="M87 77Q94 76 98 71M107 71Q111 76 118 77"
          fill="none"
          stroke="#512080"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g
        transform="translate(146 94) rotate(18)"
        stroke="#512080"
        strokeWidth="1.1"
        strokeLinejoin="round"
      >
        <path
          d="M-3 8L-3-9C-10-12-9-20-4-23L-4-16L0-13L4-16V-23C10-20 10-12 3-9V8Q0 12-3 8Z"
          fill={`url(#${id}-steel)`}
        />
        <path
          d="M0-8V6"
          fill="none"
          stroke="#f4f0ff"
          strokeWidth=".8"
          strokeLinecap="round"
        />
        <path
          d="M-9-1C-12-5-9-9-5-8L1-6C5-8 8-5 6-2C8 1 5 4 2 3C-2 6-7 4-9-1Z"
          fill="#c9afea"
        />
        <path
          d="M1-5L3-3M0-1L2 1"
          fill="none"
          strokeWidth=".7"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(121 69)">
        <g className={styles.sweat}>
          <path
            d="M0-5C-.4-1-3.8 1.2-3.6 4.1C-3.3 8.8 3.5 9 3.8 4.2C4 .9.7-1.2 0-5Z"
            fill={`url(#${id}-sweat)`}
            stroke="#512080"
            strokeWidth=".5"
          />
          <path
            d="M-1.6 1.5Q-2.8 3.7-1.8 5.2"
            fill="none"
            stroke="#fff"
            strokeOpacity=".85"
            strokeWidth=".9"
            strokeLinecap="round"
          />
          <ellipse cx="1" cy="6" rx="1.2" ry=".5" fill="#c9a5ef" opacity=".7" />
        </g>
      </g>
      <g>
        <path
          d="M44 98L50 99L74 126Q75 128 72 128H67L45 104Z"
          fill="#c78c38"
          stroke="#542b48"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M48 102L70 124"
          fill="none"
          stroke="#f5cd78"
          strokeWidth=".8"
        />
        <path
          d="M55 119L66 122"
          fill="none"
          stroke="#805138"
          strokeWidth="1.2"
        />
        <path
          d="M28 124V130H33L35 125M54 125L56 130H61V124"
          fill="#e9ad42"
          stroke="#542b48"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M41 97Q43 93 45 97L61 123Q63 127 58 127H28Q24 127 27 123Z"
          fill={`url(#${id}-warning-gold)`}
          stroke="#542b48"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M30 122L42 100M31 125H56"
          fill="none"
          stroke="#fff6cf"
          strokeWidth=".9"
          strokeLinecap="round"
          opacity=".75"
        />
        <path
          d="M41.4 105Q43 103.8 44.6 105L44 115Q43 116.2 42 115Z"
          fill="#542b48"
        />
        <path
          d="M41 99H45"
          stroke="#fff6cf"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx="43" cy="120" r="1.7" fill="#542b48" />
      </g>
    </svg>
  );
}
