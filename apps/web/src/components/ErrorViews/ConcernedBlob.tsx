import { ShadedBlobBody } from "./ShadedBlobBody";

export function ConcernedBlob({ className }: { className?: string }) {
  return (
    <svg viewBox="100 380 1000 800" aria-hidden="true" className={className}>
      <ShadedBlobBody />
      <g fill="#512080">
        <ellipse cx="570" cy="740" rx="32" ry="58" />
        <ellipse cx="750" cy="740" rx="32" ry="58" />
        <path
          d="M520 650Q561 651 592 620M728 620Q759 651 800 650"
          fill="none"
          stroke="#512080"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </g>
      <g fill="#f5eaff">
        <ellipse cx="561" cy="721" rx="8" ry="19" />
        <ellipse cx="741" cy="721" rx="8" ry="19" />
      </g>
    </svg>
  );
}
