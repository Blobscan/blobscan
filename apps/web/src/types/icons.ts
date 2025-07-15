import type {
  FC,
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
} from "react";

export type Heroicon = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, "ref"> & {
    title?: string;
    titleId?: string;
  } & RefAttributes<SVGSVGElement>
>;

export type RenderableIcon = FC<SVGProps<SVGElement>> | string | Heroicon;
