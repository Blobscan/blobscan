import { useEffect, useId, useRef } from "react";
import type { CSSProperties } from "react";

import blobLoader from "../../../public/blob-loader.webp";
import styles from "./SearchInput.module.css";

export function BlobLoader({ resting = false }: { resting?: boolean }) {
  const filterId = `blob-loader-${useId().replace(/:/g, "")}`;
  const bodyRef = useRef<HTMLSpanElement>(null);
  const eyesRef = useRef<HTMLSpanElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const restingRef = useRef(resting);
  const resumeRef = useRef<() => void>();

  useEffect(() => {
    restingRef.current = resting;
    resumeRef.current?.();
  }, [resting]);

  useEffect(() => {
    const body = bodyRef.current;
    const eyes = eyesRef.current;
    const displacement = displacementRef.current;
    if (!body || !eyes || !displacement) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let startedAt: number | undefined;
    let lastTime: number | undefined;
    let phase = 0;
    let movement = restingRef.current ? 0 : 1;

    const animate = (now: number) => {
      startedAt ??= now;
      const elapsed = now - startedAt;
      const delta = lastTime === undefined ? 0 : Math.min(now - lastTime, 50);
      lastTime = now;
      const target = restingRef.current ? 0 : 1;
      movement += (target - movement) * (1 - Math.exp(-delta / 90));
      if (Math.abs(target - movement) < 0.001) movement = target;
      phase += (delta / 1000) * Math.PI * 2 * movement;
      const wave = Math.sin(phase);
      const swell = (1 - Math.cos(phase)) / 2;
      const blinkPhase = elapsed % 1400;
      const blink =
        blinkPhase > 1200 && blinkPhase < 1320
          ? Math.max(0.12, Math.abs(blinkPhase - 1260) / 60)
          : 1;

      body.style.transform = `translateY(${-swell * 5 * movement}px) scale(${
        1 + wave * 0.1 * movement
      }, ${1 - wave * 0.085 * movement}) skewX(${wave * 7 * movement}deg)`;
      displacement.setAttribute("scale", String(swell * 32 * movement));
      const gaze = Math.sin(phase * 0.65);
      eyes.style.transform = `translate(${gaze * 3.2 * movement}px, ${
        -gaze * 1.2 * movement
      }px) scaleY(${1 - (1 - blink) * movement})`;
      frameId =
        restingRef.current && movement === 0
          ? 0
          : requestAnimationFrame(animate);
    };

    const updateMotion = () => {
      cancelAnimationFrame(frameId);
      startedAt = undefined;
      lastTime = undefined;
      movement = restingRef.current ? 0 : 1;
      body.style.transform = "none";
      eyes.style.transform = "none";
      displacement.setAttribute("scale", "0");
      if (!reducedMotion.matches) frameId = requestAnimationFrame(animate);
    };

    updateMotion();
    resumeRef.current = () => {
      if (!frameId && !reducedMotion.matches) {
        lastTime = undefined;
        frameId = requestAnimationFrame(animate);
      }
    };
    reducedMotion.addEventListener("change", updateMotion);
    return () => {
      cancelAnimationFrame(frameId);
      resumeRef.current = undefined;
      reducedMotion.removeEventListener("change", updateMotion);
    };
  }, []);

  return (
    <span
      aria-hidden="true"
      className={`${styles.blobLoader} text-accent-light dark:text-accent-dark`}
      style={
        { "--blob-loader-mask": `url(${blobLoader.src})` } as CSSProperties
      }
    >
      <svg width="0" height="0" className="absolute" focusable="false">
        <defs>
          <filter
            id={filterId}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".018 .025"
              numOctaves="1"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <span className={styles.blobCanvas}>
        <span
          ref={bodyRef}
          className={styles.blobDeformation}
          style={{ filter: `url(#${filterId})` }}
        >
          <span className={`${styles.blobLayer} ${styles.blobBody}`} />
          <span
            ref={eyesRef}
            className={`${styles.blobLayer} ${styles.blobEyes}`}
          />
          <svg
            className={styles.emptyFace}
            viewBox="0 0 112 112"
            style={{ opacity: resting ? 1 : 0 }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M53 49 Q57 49 59 46 M73 45 Q75 48 79 48" />
          </svg>
        </span>
      </span>
    </span>
  );
}
