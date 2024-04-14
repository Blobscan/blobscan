// We declare svg module to prevent:

// https://stackoverflow.com/questions/44717164/unable-to-import-svg-files-in-typescript
declare module "*.svg" {
  import type { FC, SVGProps } from "react";
  const content: FC<SVGProps<SVGElement>>;
  export default content;
}
