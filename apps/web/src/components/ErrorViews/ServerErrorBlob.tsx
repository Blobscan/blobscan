import { useId } from "react";

import { BlobIcon } from "../BlobIcon";
import { IllustrationBackground } from "./IllustrationBackground";
import { IllustrationGround } from "./IllustrationGround";
import styles from "./ServerErrorBlob.module.css";

export function ServerErrorBlob() {
  const id = `server-error-blob-${useId().replace(/:/g, "")}`;

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
        <clipPath id={`${id}-outline`}>
          <path
            d="M0 0H112V112H0Z M52.64 49.28V69.44H80.64V49.28Z"
            clipRule="evenodd"
          />
        </clipPath>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ee7445" />
          <stop offset=".6" stopColor="#ffa64d" />
          <stop offset="1" stopColor="#ffd77b" />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffe17a" />
          <stop offset="1" stopColor="#fff7bf" />
        </linearGradient>
        <clipPath id={`${id}-above-head`}>
          <path d="M45 0H130V111C122 92 116 76 108 67C101 58 95 54 85 54C76 54 68 59 62 66C55 74 49 86 45 101Z" />
        </clipPath>
        <clipPath id={`${id}-flame-silhouette`}>
          <use href={`#${id}-flame-shape`} />
        </clipPath>
        <linearGradient id={`${id}-warning-gold`} x1="0" y1="0" x2=".7" y2="1">
          <stop stopColor="#fff1aa" />
          <stop offset=".5" stopColor="#fbd46c" />
          <stop offset="1" stopColor="#e9ad42" />
        </linearGradient>
      </defs>
      <IllustrationBackground variant="server-room" />
      <IllustrationGround />
      <g clipPath={`url(#${id}-above-head)`}>
        <g>
          <path
            id={`${id}-flame-shape`}
            className={styles.flameTips}
            d="M61 80C56 56 59 51 62 47C66 52 70 50 68 42C66 34 71 30 75 27C73 36 79 36 81 29C82 21 90 18 89 9C99 16 99 23 95 30C93 36 101 39 107 29C110 38 106 44 109 48C111 51 113 49 115 46C116 54 119 57 114 80L114 95H61Z"
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
            <path
              className={styles.heatCore}
              d="M76 55C76 49 81 47 83 43C83 49 87 50 89 47C89 51 95 51 99 55L99 80H76Z"
              fill="#fff9d4"
            />
          </g>
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
      <g transform="translate(30 34)" clipPath={`url(#${id}-outline)`}>
        <BlobIcon
          variant="illustration"
          width="112"
          height="112"
          filter={`url(#${id}-thin-outline)`}
        />
      </g>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          transform="rotate(-6 88.5 92.5)"
          d="M84.5 88.5Q88 92.7 92.5 96.5M92.5 88.5Q88.2 92 84.5 96.5"
        />
        <path
          transform="rotate(5 106.5 91.5)"
          d="M102.5 87.5Q106 91.7 110.5 95.5M110.5 87.5Q106.2 91 102.5 95.5"
        />
      </g>
      <g>
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
        <circle cx="43" cy="120" r="1.7" fill="#542b48" />
      </g>
    </svg>
  );
}
