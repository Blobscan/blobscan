declare module "*.svg" {
  import type { FC, SVGProps } from "react";
  const icon: FC<SVGProps<SVGElement>>;
  export default icon;
}

declare module "*.png" {
  const image: { src: string; width: number; height: number };
  export default image;
}

declare module "*.jpg" {
  const image: { src: string; width: number; height: number };
  export default image;
}

declare module "*.jpeg" {
  const image: { src: string; width: number; height: number };
  export default image;
}
