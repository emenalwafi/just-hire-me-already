import React, { useState, useMemo } from "react";
import {
  UilCalendarAlt,
  UilAngleLeft,
  UilAngleRight,
  UilAngleDoubleLeft,
  UilAngleDoubleRight,
} from "@iconscout/react-unicons";
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  set, // Import set function to change month/year
  getMonth, // Import getMonth to check current month
  getYear, // Import getYear
  setMonth, // Import setMonth
  setYear, // Import setYear
  startOfDecade, // Import startOfDecade
  endOfDecade, // Import endOfDecade
  eachYearOfInterval, // Import eachYearOfInterval
  isSameYear, // Import isSameYear
  startOfYear, // Needed for decade view logic
} from "date-fns";

interface DatePickerProps {
  /** The currently selected date value (ISO string 'yyyy-MM-dd') or null. */
  value: string | null;
  /** Callback function when a date is selected. */
  onChange: (date: string) => void;
  /** Placeholder text when no date is selected. */
  placeholder?: string;
  /** Whether the date picker is disabled. */
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select a date",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : null;
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date()); // Represents the currently viewed date/time scope
  const [view, setView] = useState<"day" | "month" | "year" | "decade">("day"); // State for view mode

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
  const monthsOfYear = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // --- Date Calculations for Views ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [currentDate]);

  const calendarYears = useMemo(() => {
    const decadeStart = startOfDecade(currentDate);
    const decadeEnd = endOfDecade(currentDate);
    // Include previous year and next year for context
    const years = eachYearOfInterval({
      start: subYears(decadeStart, 1),
      end: addYears(decadeEnd, 1),
    });
    // Chunk into rows of 3
    const rows: Date[][] = [];
    for (let i = 0; i < years.length; i += 3) {
      rows.push(years.slice(i, i + 3));
    }
    return rows;
  }, [currentDate]);

  const calendarDecades = useMemo(() => {
    const currentYear = getYear(currentDate);
    // Calculate the start year of the 30-year block containing the current decade
    // Adjusted logic: Center the 12 decades around the current decade's start
    const currentDecadeStartYear = getYear(startOfDecade(currentDate));
    // Display roughly 4 decades before and 7 after, adjust as needed for centering
    // Let's aim to have the current decade near the second row
    const startDecadeYear = currentDecadeStartYear - 40; // Start view 4 decades before current

    const decades = [];
    for (let i = 0; i < 12; i++) {
      // Generate 12 decade ranges (4 rows of 3)
      const decadeStart = startDecadeYear + i * 10;
      decades.push({ start: decadeStart, end: decadeStart + 9 });
    }
    // Chunk into rows of 3
    const rows: { start: number; end: number }[][] = [];
    for (let i = 0; i < decades.length; i += 3) {
      rows.push(decades.slice(i, i + 3));
    }
    return rows;
  }, [currentDate]);

  const currentDecadeStart = getYear(startOfDecade(new Date()));

  const currentDecadeEnd = getYear(endOfDecade(new Date()));

  const currentDecadeStartForYearOption = getYear(startOfDecade(currentDate));
  const currentDecadeEndForYearOption = getYear(endOfDecade(currentDate));
  const currentYear = getYear(currentDate);
  // Calculate the start/end year of the 30-year block for the header
  // Let's adjust header to show the range of decades actually displayed
  const displayedDecadesFlat = calendarDecades.flat();
  const decadeViewHeaderStart = displayedDecadesFlat[0]?.start ?? currentYear; // Use first decade displayed
  const decadeViewHeaderEnd =
    displayedDecadesFlat[displayedDecadesFlat.length - 1]?.end ??
    currentYear + 9; // Use last decade displayed

  // --- Handlers ---
  const handleDayClick = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
    setView("day"); // Reset view on selection
  };

  const handleMonthClick = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex));
    setView("day"); // Switch back to day view after selecting month
  };

  const handleYearClick = (year: number) => {
    // Only proceed if the year is within the allowed range
    if (year >= 2000 && year <= 2029) {
      setCurrentDate(setYear(currentDate, year));
      setView("month"); // Switch back to month view after selecting year
    }
  };

  const handleDecadeClick = (decadeStartYear: number) => {
    // Only navigate if the clicked decade contains selectable years (2000-2029)
    const decadeEndYear = decadeStartYear + 9;
    if (decadeEndYear >= 2000 && decadeStartYear <= 2029) {
      // Adjust the target year if the decade is partially outside the selectable range
      const targetYear = Math.max(decadeStartYear, 2000); // Ensure we land within 2000-2029
      setCurrentDate(startOfYear(setYear(currentDate, targetYear)));
      setView("year"); // Switch back to year view
    }
  };

  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextYear = () => setCurrentDate(addYears(currentDate, 1));
  const goToPrevYear = () => setCurrentDate(subYears(currentDate, 1));
  const goToNextDecade = () => setCurrentDate(addYears(currentDate, 10));
  const goToPrevDecade = () => setCurrentDate(subYears(currentDate, 10));
  const goToNextDecadeBlock = () => setCurrentDate(addYears(currentDate, 100)); // Navigate by 100 years for decade block
  const goToPrevDecadeBlock = () => setCurrentDate(subYears(currentDate, 100)); // Navigate by 100 years

  // --- Button & Input Styling ---
  const triggerClasses = `
    flex w-full min-w-[200px] items-center justify-between rounded-lg
    border border-neutral-40 bg-white px-3 py-2 text-left
    font-sans text-m text-neutral-90
    transition-all
    focus:outline-none focus:ring-2 focus:ring-primary-focus/50
    ${
      disabled
        ? "cursor-not-allowed bg-neutral-20 text-neutral-50"
        : "hover:border-neutral-60"
    }
  `;

  return (
    <div className="relative inline-block w-full max-w-xs">
      {/* 1. The Trigger Button */}
      <button
        type="button"
        className={triggerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={selectedDate ? "text-neutral-90" : "text-neutral-60"}>
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </span>
        <UilCalendarAlt
          size="18"
          className={disabled ? "text-neutral-40" : "text-neutral-70"}
        />
      </button>

      {/* 2. The Calendar Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute z-10 mt-2 w-96 p-6 bg-neutral-10 rounded-2xl shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset[-1px] outline-neutral-40 inline-flex flex-col justify-start items-start gap-6 font-sans"
        >
          {/* Calendar Header: Depends on view */}
          <div className="self-stretch inline-flex justify-between items-center">
            {/* Previous Block/Decade/Year Button */}
            <div className="flex justify-end items-center gap-1">
              <button
                type="button"
                onClick={
                  view === "decade"
                    ? goToPrevDecadeBlock
                    : view === "year"
                    ? goToPrevDecade
                    : goToPrevYear
                }
                className="p-1 rounded-full hover:bg-neutral-20"
                aria-label={
                  view === "decade"
                    ? "Previous 100 years"
                    : view === "year"
                    ? "Previous decade"
                    : "Previous year"
                }
              >
                <UilAngleDoubleLeft size="24" className="text-neutral-100" />
              </button>
              {view === "day" && (
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="p-1 rounded-full hover:bg-neutral-20"
                  aria-label="Previous month"
                >
                  <UilAngleLeft size="24" className="text-neutral-100" />
                </button>
              )}
            </div>

            {/* View Title (Month/Year/Decade Range) */}
            <div className="flex justify-start items-center gap-4">
              {view === "day" && (
                <>
                  <button
                    type="button"
                    onClick={() => setView("month")}
                    className="justify-start text-neutral-90 text-lg font-bold leading-7 hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                    aria-label={`Select month for year ${format(
                      currentDate,
                      "yyyy"
                    )}`}
                  >
                    {format(currentDate, "MMM")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("year")}
                    className="justify-start text-neutral-90 text-lg font-bold leading-7 hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                    aria-label={`Current year ${format(
                      currentDate,
                      "yyyy"
                    )}, select year`}
                  >
                    {format(currentDate, "yyyy")}
                  </button>
                </>
              )}
              {view === "month" && (
                <button
                  type="button"
                  onClick={() => setView("year")}
                  className="justify-start text-neutral-90 text-lg font-bold hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                  aria-label={`Current year ${format(
                    currentDate,
                    "yyyy"
                  )}, select year`}
                >
                  {format(currentDate, "yyyy")}
                </button>
              )}
              {view === "year" && (
                <button
                  type="button"
                  onClick={() => setView("decade")}
                  className="justify-start text-neutral-90 text-lg font-bold hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                  aria-label={`Current decade ${currentDecadeStartForYearOption}-${currentDecadeEndForYearOption}, select decade range`}
                >{`${currentDecadeStartForYearOption} - ${currentDecadeEndForYearOption}`}</button>
              )}
              {view === "decade" && (
                <div className="justify-start text-neutral-90 text-lg font-bold">{`${decadeViewHeaderStart} - ${decadeViewHeaderEnd}`}</div>
              )}
            </div>

            {/* Next Block/Decade/Year Button */}
            <div className="flex justify-end items-center gap-1">
              {view === "day" && (
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-1 rounded-full hover:bg-neutral-20"
                  aria-label="Next month"
                >
                  <UilAngleRight size="24" className="text-neutral-100" />
                </button>
              )}
              <button
                type="button"
                onClick={
                  view === "decade"
                    ? goToNextDecadeBlock
                    : view === "year"
                    ? goToNextDecade
                    : goToNextYear
                }
                className="p-1 rounded-full hover:bg-neutral-20"
                aria-label={
                  view === "decade"
                    ? "Next 100 years"
                    : view === "year"
                    ? "Next decade"
                    : "Next year"
                }
              >
                <UilAngleDoubleRight size="24" className="text-neutral-100" />
              </button>
            </div>
          </div>

          {/* Calendar Grid: Depends on view */}
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            {/* Day View Grid */}
            {view === "day" && (
              <>
                <div className="self-stretch inline-flex justify-start items-start gap-2">
                  {daysOfWeek.map((day, index) => (
                    <div
                      key={`${day}-${index}`}
                      className="flex-1 text-center justify-start text-neutral-100 text-base font-bold leading-6"
                      aria-hidden="true"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {calendarDays.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="self-stretch inline-flex justify-start items-start gap-2"
                  >
                    {row.map((day, dayIndex) => {
                      const isSelected =
                        selectedDate && isSameDay(day, selectedDate);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isCurrentDay = isToday(day);
                      let dayTextClasses = "text-base font-normal leading-6";
                      let dayButtonClasses =
                        "w-10 h-10 p-2 flex justify-center items-center gap-2 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus";
                      if (!isCurrentMonth) {
                        dayTextClasses += " text-neutral-60";
                        dayButtonClasses +=
                          " bg-neutral-10 hover:bg-neutral-10 cursor-default";
                      } else if (isSelected) {
                        dayTextClasses += " text-white";
                        dayButtonClasses +=
                          " bg-primary-main hover:bg-primary-hover";
                      } else if (isCurrentDay) {
                        dayTextClasses += " text-neutral-90 font-bold";
                        dayButtonClasses +=
                          " bg-neutral-20 hover:bg-neutral-30 outline outline-1 outline-neutral-40";
                      } else {
                        dayTextClasses += " text-neutral-90";
                        dayButtonClasses +=
                          " bg-neutral-10 hover:bg-neutral-20";
                      }
                      return (
                        <button
                          type="button"
                          key={dayIndex}
                          className={dayButtonClasses}
                          onClick={() => handleDayClick(day)}
                          disabled={!isCurrentMonth}
                          aria-label={`Select ${format(day, "PPP")}`}
                          aria-pressed={isSelected || false}
                        >
                          <div className={dayTextClasses}>
                            {format(day, "d")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {/* Month View Grid */}
            {view === "month" && (
              <div className="grid grid-cols-3 gap-2 w-full">
                {monthsOfYear.map((monthName, monthIndex) => {
                  const isCurrentSelectedMonth =
                    getMonth(currentDate) === monthIndex;
                  let monthButtonClasses = `flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus`;
                  if (isCurrentSelectedMonth) {
                    monthButtonClasses +=
                      " bg-primary-surface text-primary-main font-bold outline outline-1 outline-primary-border";
                  } else {
                    monthButtonClasses +=
                      " bg-neutral-10 text-neutral-90 hover:bg-neutral-20";
                  }
                  return (
                    <button
                      key={monthIndex}
                      type="button"
                      className={monthButtonClasses}
                      onClick={() => handleMonthClick(monthIndex)}
                      aria-label={`Select ${monthName} ${getYear(currentDate)}`}
                    >
                      <div className="text-center text-base">{monthName}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Year View Grid */}
            {view === "year" && (
              <div className="grid grid-cols-3 gap-2 w-full">
                {calendarYears.flat().map((yearDate) => {
                  const year = getYear(yearDate);
                  const isCurrentSelectedYear = getYear(currentDate) === year;
                  const isCurrentDecadeYear =
                    year >= currentDecadeStartForYearOption &&
                    year <= currentDecadeEndForYearOption;
                  const isSelectableYear = year >= 2000 && year <= 2029; // Allowed range

                  let yearButtonClasses = `flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus`;
                  let yearTextClasses = "text-center text-base";
                  let isDisabled = !isSelectableYear; // Disable if outside allowed range 2000-2029
                  
                  // Apply styles based on whether it's inside/outside the current decade VIEW first
                  if (year > currentDecadeEnd) {
                    // Disabled style (after 2029)
                    yearTextClasses += " text-neutral-50";
                    yearButtonClasses +=
                      " bg-neutral-20 hover:bg-neutral-20 cursor-default";
                    isDisabled = true;
                  } else if (!isCurrentDecadeYear) {
                    // Style for years outside the current decade being viewed (but potentially selectable)
                    yearTextClasses += isSelectableYear
                      ? " text-neutral-90"
                      : " text-neutral-60"; // Dim if outside selectable range too
                    yearButtonClasses += " bg-neutral-10 hover:bg-neutral-10";
                    yearButtonClasses += isSelectableYear
                      ? " hover:bg-neutral-20"
                      : " ";
                  } else if (year < currentDecadeStart - 20) {
                    // Off style (before 2000) - Should be caught by !isCurrentDecadeYear mostly, but good fallback
                    yearTextClasses += " text-neutral-60";
                    yearButtonClasses +=
                      " bg-neutral-10 hover:bg-neutral-10 cursor-default";
                    isDisabled = true;
                  } else if (isCurrentSelectedYear) {
                    // Selected Year style (within 2000-2029 and current view)
                    yearTextClasses += " text-primary-main font-bold";
                    yearButtonClasses +=
                      " bg-primary-surface outline outline-1 outline-primary-border hover:bg-primary-surface"; // Keep bg on hover
                  } else {
                    // Default selectable year style (within 2000-2029 and current view)
                    yearTextClasses += " text-neutral-90";
                    yearButtonClasses += " bg-neutral-10 hover:bg-neutral-20";
                  }

                  return (
                    <button
                      key={year}
                      type="button"
                      className={yearButtonClasses}
                      onClick={() => handleYearClick(year)}
                      disabled={isDisabled}
                      aria-label={
                        isDisabled
                          ? `Year ${year} (not selectable)`
                          : `Select year ${year}`
                      }
                      aria-pressed={isCurrentSelectedYear && isSelectableYear}
                    >
                      <div className={yearTextClasses}>{year}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Decade View Grid */}
            {view === "decade" && (
              <div className="grid grid-cols-3 gap-2 w-full">
                {calendarDecades.flat().map((decade) => {
                  const isCurrentDecadeRange =
                    currentDecadeStart >= decade.start &&
                    currentDecadeEnd <= decade.end;
                  const isSelectableDecade =
                    decade.end >= 1999 && decade.start <= 2029; // Does this decade contain any selectable years?
                  console.log(currentDecadeStart, currentDecadeEnd);

                  let decadeButtonClasses = `
                        flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2
                        transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus text-center text-base
                    `;
                  let isDisabled = !isSelectableDecade; // Disable if the decade contains no selectable years (2000-2029)

                  // Apply relative styling based on current decade
                  if (decade.end < currentDecadeStart - 20) {
                    // Ends before the previous decade starts (more than 2 decades ago)
                    decadeButtonClasses +=
                      " bg-neutral-10 text-neutral-60 hover:bg-neutral-10 cursor-default"; // Off style
                    isDisabled = true;
                  } else if (decade.start > currentDecadeEnd) {
                    // Starts after the current decade ends
                    decadeButtonClasses +=
                      " bg-neutral-20 text-neutral-50 hover:bg-neutral-20 cursor-default"; // Disabled style
                    isDisabled = true;
                  } else if (isCurrentDecadeRange) {
                    // Selected Decade style
                    decadeButtonClasses +=
                      " bg-primary-surface text-primary-main font-bold outline outline-1 outline-primary-border hover:bg-primary-surface";
                  } else {
                    // Default Selectable Decade style
                    decadeButtonClasses +=
                      " bg-neutral-10 text-neutral-90 hover:bg-neutral-20";
                  }

                  // Final check - ensure it's truly selectable overall
                  if (!isSelectableDecade && !isDisabled) {
                    // Apply disabled style if somehow missed above but contains no selectable years
                    decadeButtonClasses = decadeButtonClasses.replace(
                      " text-neutral-90 hover:bg-neutral-20",
                      " bg-neutral-20 text-neutral-50 hover:bg-neutral-20 cursor-default"
                    );
                    isDisabled = true;
                  }

                  return (
                    <button
                      key={decade.start}
                      type="button"
                      className={decadeButtonClasses}
                      onClick={() => handleDecadeClick(decade.start)}
                      disabled={isDisabled}
                      aria-label={
                        isDisabled
                          ? `Decade ${decade.start} - ${decade.end} (not selectable)`
                          : `Select decade ${decade.start} - ${decade.end}`
                      }
                      aria-pressed={isCurrentDecadeRange && isSelectableDecade}
                    >
                      {`${decade.start}-${decade.end}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
