import type { ReactNode } from "react";
import React from "react";

type Color = keyof typeof colorVariants;

type BadgeProps = {
  label: string;
  icon: ReactNode;
  color: Color;
};

const colorVariants = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  slate: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
};

const Badge: React.FC<BadgeProps> = ({ label, icon, color }) => {
  const colorClasses = colorVariants[color];

  return (
    <span className={`me-2 rounded-full px-2.5 py-0.5 ${colorClasses}`}>
      <div className="flex items-center">
        {icon}
        <div className="ml-2">{label}</div>
      </div>
    </span>
  );
};

export default Badge;
