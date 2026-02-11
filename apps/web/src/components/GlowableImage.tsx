import type { FC } from "react";
import { useState } from "react";
import Image from "next/image";
import type { ImageProps } from "next/image";

import { Glowable } from "./Glowable";
import type { GlowableProps } from "./Glowable";

type GlowableImageProps = Omit<GlowableProps, "children" | "enabled"> & {
  imageProps: ImageProps;
  defaultEnabled?: boolean;
};

export const GlowableImage: FC<GlowableImageProps> = function ({
  imageProps,
  defaultEnabled = false,
  ...glowProps
}) {
  const [loaded, setLoaded] = useState(defaultEnabled);

  return (
    <Glowable {...glowProps} enabled={loaded}>
      <Image
        {...imageProps}
        onLoad={(img) => {
          imageProps.onLoad?.(img);
          setLoaded(true);
        }}
      />
    </Glowable>
  );
};
