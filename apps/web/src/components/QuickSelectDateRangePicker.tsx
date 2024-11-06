import React, { useState, useEffect, useMemo, memo } from "react";
import { Select, MenuItem, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Dayjs } from "dayjs";

import dayjs from "@blobscan/dayjs";

export type Date = Dayjs | null;
export type DateRange = [Date, Date];

export type QuickSelectDateRangePickerProps = {
  defaultOption?: 1 | 3 | 7 | 30 | -1;
  onInitialChange?: (range: DateRange) => void;
  onChange?: (range: DateRange) => void;
};

const quickOptions: Array<{ value: number; label: string }> = [
  {
    value: 1,
    label: "1 Day",
  },
  {
    value: 3,
    label: "3 Days",
  },
  {
    value: 7,
    label: "7 Days",
  },
  {
    value: 30,
    label: "30 Days",
  },
  {
    value: -1,
    label: "Custom",
  },
];

const QuickSelectDateRangePicker: React.FC<QuickSelectDateRangePickerProps> = ({
  defaultOption = 1,
  onInitialChange,
  onChange,
}) => {
  // Set the default selection to "1 Day" and date range to the last 1 day
  const [selectedQuickOption, setSelectedQuickOption] =
    useState<number>(defaultOption);
  const [startDate, setStartDate] = useState<Date>(null);
  const [endDate, setEndDate] = useState<Date>(null);

  const calculateDateRange = (option: number): DateRange => {
    const now = dayjs();
    return [dayjs().subtract(option, "day"), now];
  };

  const handleStartDateChange = (
    newValue: Date,
    shouldTriggerOnChange?: boolean
  ) => {
    let start = startDate;
    let end = endDate;
    if (newValue && endDate && newValue.isAfter(endDate)) {
      end = null; // Reset end date if start date is after end date
      setEndDate(end);
    }
    start = newValue;
    setStartDate(start);
    if (shouldTriggerOnChange && onChange) {
      onChange([start, end]);
    }
  };

  const handleEndDateChange = (
    newValue: Date,
    shouldTriggerOnChange?: boolean
  ) => {
    let start = startDate;
    let end = endDate;
    if (newValue && startDate && newValue.isBefore(startDate)) {
      end = null; // Reset start date if end date is before start date
      setStartDate(end);
    }
    start = newValue;
    setEndDate(start);
    if (shouldTriggerOnChange && onChange) {
      onChange([start, end]);
    }
  };

  const setDateRange = (dateRange: DateRange) => {
    const [start, end] = dateRange;
    handleStartDateChange(start);
    handleEndDateChange(end);
  };

  // Initialize date range based on default option
  useEffect(() => {
    const initialRange = calculateDateRange(defaultOption);
    setDateRange(initialRange);
    if (onInitialChange) onInitialChange(initialRange);
  }, [defaultOption, onInitialChange]);

  // Restrict the date picker to the past 30 days
  const minDate = dayjs().subtract(30, "day");
  const maxDate = dayjs();

  const isDisabled = useMemo(
    () => selectedQuickOption !== -1,
    [selectedQuickOption]
  );

  return (
    <div className="flex items-center">
      <div className="inline-block align-middle">
        <Typography>Select a Date Range:</Typography>
      </div>

      {/* Quick Selection Dropdown */}
      <div className="ml-4 inline-block align-middle">
        <Select
          value={selectedQuickOption}
          onChange={(event) => {
            const newOption = event.target.value as number;
            setSelectedQuickOption(newOption);
            if (newOption !== -1) {
              const newRange = calculateDateRange(newOption);
              setDateRange(newRange);
              if (onChange) onChange(newRange);
            }
          }}
        >
          {quickOptions.map(({ value, label }) => (
            <MenuItem value={value} key={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </div>

      {/* Date Range Picker */}
      <div className="ml-4 flex-1">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div>
            <div className="inline-block align-middle">
              <DateTimePicker
                label="Start Date"
                value={startDate}
                onChange={(date) => handleStartDateChange(date, true)}
                minDate={minDate}
                maxDate={maxDate}
                disabled={isDisabled}
              />
            </div>
            <div className="ml-4 inline-block align-middle">--</div>
            <div className="ml-4 inline-block align-middle">
              <DateTimePicker
                label="End Date"
                value={endDate}
                onChange={(date) => handleEndDateChange(date, true)}
                minDate={minDate}
                maxDate={maxDate}
                disabled={isDisabled}
              />
            </div>
          </div>
        </LocalizationProvider>
      </div>
    </div>
  );
};

export default memo(QuickSelectDateRangePicker);
