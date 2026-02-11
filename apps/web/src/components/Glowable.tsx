import type { FC, ReactNode } from "react";

export interface GlowableProps {
  children: ReactNode;
  enabled?: boolean;
  top?: string;
  bottom?: string;
  right?: string;
  left?: string;
}
export const Glowable: FC<GlowableProps> = function ({
  children,
  enabled = true,
  top,
  bottom,
  left,
  right,
}) {
  return (
    <div className="relative">
      {enabled && (
        <div
          className="animate-glow absolute bg-transparent"
          style={{
            top,
            bottom,
            left,
            right,
          }}
        />
      )}
      {children}
    </div>
  );
};
