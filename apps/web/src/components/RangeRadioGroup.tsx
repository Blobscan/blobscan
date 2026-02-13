import { Radio, RadioGroup } from "@headlessui/react";
import { CalendarIcon, ClockIcon, CubeIcon } from "@heroicons/react/24/solid";
import classNames from "classnames";

import { Icon } from "./Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export type Range = "block" | "date" | "slot";

type RangeOption = {
  value: Range;
  icon: React.ReactNode;
  tooltipText: string;
};

const RANGE_OPTIONS: RangeOption[] = [
  {
    value: "block",
    icon: <Icon src={CubeIcon} />,
    tooltipText: "Filter by Block Number Range",
  },
  {
    value: "date",
    icon: <Icon src={CalendarIcon} />,
    tooltipText: "Filter by Date Range",
  },
  {
    value: "slot",
    icon: <Icon src={ClockIcon} />,
    tooltipText: "Filter by Slot Range",
  },
];

export interface RangeRadioGroupProps {
  selected: Range;
  onChange: (selected: Range) => void;
}

export function RangeRadioGroup(props: RangeRadioGroupProps) {
  return (
    <RadioGroup
      value={props.selected}
      onChange={props.onChange}
      className="flex h-full w-full cursor-pointer flex-row items-center rounded-s-lg bg-controlBackground-light  shadow-md dark:bg-controlBackground-dark"
    >
      {RANGE_OPTIONS.map((option, i) => (
        <Tooltip key={option.value}>
          <TooltipContent>{option.tooltipText}</TooltipContent>
          <TooltipTrigger
            className={classNames(
              "h-full w-full items-center justify-center text-icon-light transition-colors dark:text-icon-dark",
              {
                "border-r border-white/5": i < RANGE_OPTIONS.length - 1,
                "rounded-s-md": i === 0,
                "hover:text-iconHighlight-light  dark:hover:text-iconHighlight-dark":
                  props.selected !== option.value,
                "bg-primary-300/40 dark:bg-primary-600/30":
                  props.selected === option.value,
              }
            )}
          >
            <Radio
              className="flex items-center justify-center"
              value={option.value}
            >
              {option.icon}
            </Radio>
          </TooltipTrigger>
        </Tooltip>
      ))}
    </RadioGroup>
  );
}
