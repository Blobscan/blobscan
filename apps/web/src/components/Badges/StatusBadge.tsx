import type { FC } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

import type { ResourceDefinition } from "~/types/definition";
import type { RenderableIcon } from "~/types/icons";
import { capitalize } from "~/utils";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { BrandBadge } from "./BrandBadge";

export type Status = "finalized" | "unfinalized" | "success" | "failed";

type StatusConfig = {
  icon?: RenderableIcon;
  color: ResourceDefinition["color"];
};

const STATUSES: Record<Status, StatusConfig> = {
  success: {
    icon: CheckCircleIcon,
    color: { light: "#16A34A", dark: "#4ADE80" },
  },
  failed: {
    icon: XCircleIcon,
    color: { light: "#DC2626", dark: "#F87171" },
  },
  finalized: {
    icon: CheckCircleIcon,
    color: { light: "#16A34A", dark: "#4ADE80" },
  },
  unfinalized: {
    icon: ClockIcon,
    color: { light: "#6B7280", dark: "#9CA3AF" },
  },
};

interface StatusBadgeProps extends BadgeProps {
  status: Status;
}

export const StatusBadge: FC<StatusBadgeProps> = ({
  status = "unfinalized",
  ...props
}) => {
  const { color, icon } = STATUSES[status];
  const statusIcon = icon ? (
    <Icon src={icon} size={props.size ?? "sm"} />
  ) : null;
  return (
    <BrandBadge brandColor={color} {...props}>
      {statusIcon}
      {capitalize(status)}
    </BrandBadge>
  );
};
