import { useEffect, useId, useRef } from "react";

import { ShadedBlobBody } from "../ErrorViews/ShadedBlobBody";
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
    let lastTime: number | undefined;
    let phase = 0;
    let movement = restingRef.current ? 0 : 1;

    const animate = (now: number) => {
      const delta = lastTime === undefined ? 0 : Math.min(now - lastTime, 50);
      lastTime = now;
      const target = restingRef.current ? 0 : 1;
      movement += (target - movement) * (1 - Math.exp(-delta / 90));
      if (Math.abs(target - movement) < 0.001) movement = target;
      phase += (delta / 1000) * Math.PI * 2 * movement;
      const wave = Math.sin(phase);
      const swell = (1 - Math.cos(phase)) / 2;
      const blinkPhase = ((phase / (Math.PI * 2)) % 1) * 1000;
      const blink =
        blinkPhase > 800 && blinkPhase < 920
          ? Math.max(0.12, Math.abs(blinkPhase - 860) / 60)
          : 1;

      body.style.transform = `translateY(${-swell * 5 * movement}px) scale(${
        1 + wave * 0.1 * movement
      }, ${1 - wave * 0.085 * movement}) skewX(${wave * 7 * movement}deg)`;
      displacement.setAttribute("scale", String(swell * 32 * movement));
      const gaze = Math.sin(phase);
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
      className={`${styles.blobLoader} text-contentTertiary-light opacity-50 dark:text-contentTertiary-dark`}
    >
      <svg width="0" height="0" className="absolute" focusable="false">
        <defs>
          <filter id={`${filterId}-color`} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.213 -0.715 -0.072 1 0"
              result="shading"
            />
            <feFlood floodColor="currentColor" />
            <feComposite in2="shading" operator="in" />
          </filter>
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
          <svg className={styles.blobLayer} viewBox="0 0 1280 1280">
            <g filter={`url(#${filterId}-color)`}>
              <ShadedBlobBody />
            </g>
          </svg>
          <span
            ref={eyesRef}
            className={`${styles.blobLayer} ${styles.blobEyes}`}
          >
            <svg viewBox="0 0 1280 1280" fill="currentColor">
              <ellipse cx="614" cy="750" rx="30" ry="54" />
              <ellipse cx="779" cy="736" rx="29" ry="50" />
            </svg>
          </span>
          <svg
            className={styles.emptyFace}
            viewBox="0 0 112 112"
            style={{ opacity: resting ? 1 : 0 }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M49 59Q53 58 55 55M66 54Q70 57 74 57" />
          </svg>
        </span>
      </span>
    </span>
  );
}
