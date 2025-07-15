import type {
  FC,
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
} from "react";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

import { capitalize } from "~/utils";
import { Icon } from "../Icon";
import { Badge } from "./Badge";

export type Status = "finalized" | "unfinalized";

type StatusConfig = {
  icon?: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, "ref"> & {
      title?: string;
      titleId?: string;
    } & RefAttributes<SVGSVGElement>
  >;
  style: string;
};

const STATUSES: Record<Status, StatusConfig> = {
  finalized: {
    icon: CheckCircleIcon,
    style:
      "bg-green-300 text-green-700 border-green-600 dark:bg-green-900/60 dark:text-green-500",
  },
  unfinalized: {
    icon: ClockIcon,
    style: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  },
};

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, ...props }) => {
  const { style, icon } = STATUSES[status];
  const statusIcon = icon ? <Icon src={icon} /> : null;
  return (
    <Badge className={style} {...props}>
      {statusIcon}
      {capitalize(status)}
    </Badge>
  );
};
