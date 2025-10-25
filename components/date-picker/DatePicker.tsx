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
  parseISO, // Use parseISO for prop parsing
  isValid, // Check if parsed date is valid
  set,
  getMonth,
  getYear,
  setMonth,
  setYear,
  startOfDecade,
  endOfDecade,
  eachYearOfInterval,
  isSameYear,
  startOfYear,
  startOfDay,
  isBefore, // Use isBefore for comparisons
  isAfter, // Use isAfter for comparisons
  max, // Use max for clamping dates
  min, // Use min for clamping dates
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
  /** Optional minimum selectable date (ISO string 'yyyy-MM-dd'). */
  minDate?: string;
  /** Optional maximum selectable date (ISO string 'yyyy-MM-dd'). */
  maxDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select a date",
  disabled = false,
  minDate: minDateProp,
  maxDate: maxDateProp,
}) => {
  // --- Parse Min/Max Date Props ---
  const minDate = useMemo(() => {
    if (!minDateProp) return null;
    const parsed = parseISO(minDateProp);
    return isValid(parsed) ? startOfDay(parsed) : null; // Use startOfDay for accurate comparison
  }, [minDateProp]);

  const maxDate = useMemo(() => {
    if (!maxDateProp) return null;
    const parsed = parseISO(maxDateProp);
    return isValid(parsed) ? startOfDay(parsed) : null; // Use startOfDay for accurate comparison
  }, [maxDateProp]);

  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = parseISO(value);
    // Ensure selected date is within bounds if bounds exist
    if (isValid(parsed)) {
      const bounded = minDate && isBefore(parsed, minDate) ? minDate : parsed;
      return maxDate && isAfter(bounded, maxDate) ? maxDate : bounded;
    }
    return null;
  }, [value, minDate, maxDate]);

  // Ensure initial view date is within bounds
  const getBoundedInitialDate = () => {
    const initial = selectedDate || new Date();
    const afterMin = minDate ? max([initial, minDate]) : initial;
    return maxDate ? min([afterMin, maxDate]) : afterMin;
  };
  const [currentDate, setCurrentDate] = useState(getBoundedInitialDate());
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
    const currentDecadeStartYear = getYear(startOfDecade(currentDate));
    const startDecadeYear = currentDecadeStartYear - 40; // Start view 4 decades before current

    const decades = [];
    for (let i = 0; i < 12; i++) {
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

  const currentViewDecadeStart = getYear(startOfDecade(currentDate));
  const currentViewDecadeEnd = getYear(endOfDecade(currentDate));
  const currentYear = getYear(currentDate);

  // Header range calculation for Decade view
  const displayedDecadesFlat = calendarDecades.flat();
  const decadeViewHeaderStart = displayedDecadesFlat[0]?.start ?? currentYear;
  const decadeViewHeaderEnd =
    displayedDecadesFlat[displayedDecadesFlat.length - 1]?.end ??
    currentYear + 9;

  // --- Navigation Disable Logic ---
  // Check if previous/next period start is before minDate or after maxDate
  const canGoPrevMonth =
    !minDate || isAfter(startOfMonth(currentDate), minDate);
  const canGoPrevYear = !minDate || getYear(currentDate) > getYear(minDate);
  const canGoNextMonth =
    !maxDate || isBefore(startOfMonth(currentDate), startOfMonth(maxDate));
  const canGoNextYear = !maxDate || getYear(currentDate) < getYear(maxDate);
  const canGoPrevDecade = !minDate || currentViewDecadeStart > getYear(minDate);
  const canGoNextDecade = !maxDate || currentViewDecadeEnd < getYear(maxDate);
  // Allow block navigation unless min/max date restricts it significantly (optional, can be always true)
  const canGoPrevDecadeBlock =
    !minDate || currentViewDecadeStart - 100 >= getYear(minDate); // Simplified check
  const canGoNextDecadeBlock =
    !maxDate || currentViewDecadeEnd + 100 <= getYear(maxDate); // Simplified check

  // --- Handlers ---
  const handleDayClick = (day: Date) => {
    // Check if the clicked day is within the allowed range
    const dayStart = startOfDay(day);
    if (
      (!minDate || !isBefore(dayStart, minDate)) &&
      (!maxDate || !isAfter(dayStart, maxDate))
    ) {
      onChange(format(day, "yyyy-MM-dd"));
      setIsOpen(false);
      setView("day"); // Reset view on selection
    }
  };

  const handleMonthClick = (monthIndex: number) => {
    const targetMonthStart = startOfMonth(setMonth(currentDate, monthIndex));
    // Ensure the target month overlaps with the allowed range
    if (
      (!minDate || !isBefore(endOfMonth(targetMonthStart), minDate)) &&
      (!maxDate || !isAfter(targetMonthStart, maxDate))
    ) {
      // Clamp the date if the current day doesn't exist in the target month/year bounds
      let targetDate = setMonth(currentDate, monthIndex);
      if (minDate && isBefore(targetDate, minDate)) targetDate = minDate;
      if (maxDate && isAfter(targetDate, maxDate)) targetDate = maxDate;
      setCurrentDate(targetDate);
      setView("day"); // Switch back to day view after selecting month
    }
  };

  const handleYearClick = (year: number) => {
    // Ensure the target year overlaps with the allowed range
    if (
      (!minDate || year >= getYear(minDate)) &&
      (!maxDate || year <= getYear(maxDate))
    ) {
      // Clamp the date if the current day/month doesn't exist in the target year bounds
      let targetDate = setYear(currentDate, year);
      if (minDate && isBefore(targetDate, minDate)) targetDate = minDate;
      if (maxDate && isAfter(targetDate, maxDate)) targetDate = maxDate;
      setCurrentDate(targetDate);
      setView("month");
    }
  };

  const handleDecadeClick = (decadeStartYear: number) => {
    // Ensure the target decade overlaps with the allowed range
    const decadeEndYear = decadeStartYear + 9;
    if (
      (!minDate || decadeEndYear >= getYear(minDate)) &&
      (!maxDate || decadeStartYear <= getYear(maxDate))
    ) {
      // Clamp the date to the start of the decade, bounded by min/max
      let targetYear = decadeStartYear;
      if (minDate && targetYear < getYear(minDate))
        targetYear = getYear(minDate);
      if (maxDate && targetYear > getYear(maxDate))
        targetYear = getYear(maxDate); // Land on max year if decade starts after

      let targetDate = startOfYear(setYear(currentDate, targetYear));
      if (minDate && isBefore(targetDate, minDate)) targetDate = minDate;
      if (maxDate && isAfter(targetDate, maxDate)) targetDate = maxDate;

      setCurrentDate(targetDate);
      setView("year"); // Switch back to year view
    }
  };

  // --- Navigation Functions ---
  const goToNextMonth = () =>
    canGoNextMonth && setCurrentDate(addMonths(currentDate, 1));
  const goToPrevMonth = () =>
    canGoPrevMonth && setCurrentDate(subMonths(currentDate, 1));
  const goToNextYear = () =>
    canGoNextYear && setCurrentDate(addYears(currentDate, 1));
  const goToPrevYear = () =>
    canGoPrevYear && setCurrentDate(subYears(currentDate, 1));
  const goToNextDecade = () =>
    canGoNextDecade && setCurrentDate(addYears(currentDate, 1)); // Navigate year view
  const goToPrevDecade = () =>
    canGoPrevDecade && setCurrentDate(subYears(currentDate, 10)); // Navigate year view
  const goToNextDecadeBlock = () =>
    canGoNextDecadeBlock && setCurrentDate(addYears(currentDate, 100)); // Navigate decade view
  const goToPrevDecadeBlock = () =>
    canGoPrevDecadeBlock && setCurrentDate(subYears(currentDate, 100)); // Navigate decade view

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

  // Helper to get button classes based on disabled state
  const getNavButtonClasses = (isDisabled: boolean) => {
    return `p-1 rounded-full ${
      isDisabled
        ? "text-neutral-60 cursor-not-allowed"
        : "text-neutral-100 hover:bg-neutral-20"
    }`;
  };

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
                    : goToPrevYear // Day and Month views use PrevYear
                }
                disabled={
                  (view === "decade" && !canGoPrevDecadeBlock) ||
                  (view === "year" && !canGoPrevDecade) ||
                  ((view === "day" || view === "month") && !canGoPrevYear)
                }
                className={getNavButtonClasses(
                  (view === "decade" && !canGoPrevDecadeBlock) ||
                    (view === "year" && !canGoPrevDecade) ||
                    ((view === "day" || view === "month") && !canGoPrevYear)
                )}
                aria-label={
                  view === "decade"
                    ? "Previous 100 years"
                    : view === "year"
                    ? "Previous decade"
                    : "Previous year"
                }
              >
                <UilAngleDoubleLeft size="24" />
              </button>
              {view === "day" && (
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  disabled={!canGoPrevMonth}
                  className={getNavButtonClasses(!canGoPrevMonth)}
                  aria-label="Previous month"
                >
                  <UilAngleLeft size="24" />
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
                  aria-label={`Current decade ${currentViewDecadeStart}-${currentViewDecadeEnd}, select decade range`}
                >{`${currentViewDecadeStart} - ${currentViewDecadeEnd}`}</button>
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
                  disabled={!canGoNextMonth}
                  className={getNavButtonClasses(!canGoNextMonth)}
                  aria-label="Next month"
                >
                  <UilAngleRight size="24" />
                </button>
              )}
              <button
                type="button"
                onClick={
                  view === "decade"
                    ? goToNextDecadeBlock
                    : view === "year"
                    ? goToNextDecade
                    : goToNextYear // Day and Month views use NextYear
                }
                disabled={
                  (view === "decade" && !canGoNextDecadeBlock) ||
                  (view === "year" && !canGoNextDecade) ||
                  ((view === "day" || view === "month") && !canGoNextYear)
                }
                className={getNavButtonClasses(
                  (view === "decade" && !canGoNextDecadeBlock) ||
                    (view === "year" && !canGoNextDecade) ||
                    ((view === "day" || view === "month") && !canGoNextYear)
                )}
                aria-label={
                  view === "decade"
                    ? "Next 100 years"
                    : view === "year"
                    ? "Next decade"
                    : "Next year"
                }
              >
                <UilAngleDoubleRight size="24" />
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
                      // Check if the day is outside the allowed range
                      const dayStart = startOfDay(day);
                      const isDisabledDay =
                        !isCurrentMonth ||
                        (minDate && isBefore(dayStart, minDate)) ||
                        (maxDate && isAfter(dayStart, maxDate));

                      let dayTextClasses = "text-base font-normal leading-6";
                      let dayButtonClasses =
                        "w-10 h-10 p-2 flex justify-center items-center gap-2 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus";

                      if (isDisabledDay) {
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
                          disabled={isDisabledDay || false} // Disable if off-month or outside range
                          aria-label={
                            isDisabledDay
                              ? `Date ${format(day, "PPP")} (not selectable)`
                              : `Select ${format(day, "PPP")}`
                          }
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
                  // Check if this month is outside the allowed range for the current year
                  const targetMonthStart = startOfMonth(
                    setMonth(currentDate, monthIndex)
                  );
                  const targetMonthEnd = endOfMonth(targetMonthStart);
                  const isDisabledMonth =
                    (minDate && isBefore(targetMonthEnd, minDate)) ||
                    (maxDate && isAfter(targetMonthStart, maxDate));

                  let monthButtonClasses = `flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus`;

                  if (isDisabledMonth) {
                    monthButtonClasses +=
                      " bg-neutral-10 text-neutral-60 hover:bg-neutral-10 cursor-default";
                  } else if (isCurrentSelectedMonth) {
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
                      disabled={isDisabledMonth || false}
                      aria-label={
                        isDisabledMonth
                          ? `${monthName} ${getYear(
                              currentDate
                            )} (not selectable)`
                          : `Select ${monthName} ${getYear(currentDate)}`
                      }
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
                    year >= currentViewDecadeStart &&
                    year <= currentViewDecadeEnd;
                  const isSelectableYear =
                    (!minDate || year >= getYear(minDate)) &&
                    (!maxDate || year <= getYear(maxDate));
                  let isDisabled = !isCurrentDecadeYear || !isSelectableYear; // Disable if outside decade view OR outside min/max range

                  let yearButtonClasses = `flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus`;
                  let yearTextClasses = "text-center text-base";

                  // Style based on view and selectability
                  if (!isSelectableYear) {
                    if (maxDate && year > getYear(maxDate)) {
                      yearTextClasses += " text-neutral-50";
                      yearButtonClasses +=
                        " bg-neutral-20 hover:bg-neutral-20 cursor-default";
                    } else {
                      yearTextClasses += " text-neutral-60";
                      yearButtonClasses +=
                        " bg-neutral-10 hover:bg-neutral-10 cursor-default";
                    }
                  } else if (!isCurrentDecadeYear) {
                    yearTextClasses += " text-neutral-60"; // Style for outside decade view
                    yearButtonClasses +=
                      " bg-neutral-10 hover:bg-neutral-10 cursor-default";
                  } else if (isCurrentSelectedYear) {
                    yearTextClasses += " text-primary-main font-bold";
                    yearButtonClasses +=
                      " bg-primary-surface outline outline-1 outline-primary-border hover:bg-primary-surface";
                  } else {
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
                    currentViewDecadeStart >= decade.start && // Use the decade start based on currentDate
                    currentViewDecadeEnd <= decade.end;
                  // Decade is considered selectable if it overlaps with the min/max year range
                  const isSelectableDecade =
                    (!minDate || decade.end >= getYear(minDate)) &&
                    (!maxDate || decade.start <= getYear(maxDate));

                  let decadeButtonClasses = `
                        flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2
                        transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus text-center text-base
                    `;
                  let isDisabled = !isSelectableDecade;

                  // Style based on selection and selectability (no relative "Off" or "Disabled" logic)
                  if (isCurrentDecadeRange && isSelectableDecade) {
                    // Selected Decade style (overlaps with selectable range)
                    decadeButtonClasses +=
                      " bg-primary-surface text-primary-main font-bold outline outline-1 outline-primary-border hover:bg-primary-surface";
                  } else if (isSelectableDecade) {
                    // Default Selectable Decade style (overlaps with selectable range)
                    decadeButtonClasses +=
                      " bg-neutral-10 text-neutral-90 hover:bg-neutral-20";
                  } else {
                    // Style for decades completely outside the min/max selectable range
                    if (maxDate && decade.start > getYear(maxDate)) {
                      decadeButtonClasses +=
                        " bg-neutral-20 text-neutral-50 hover:bg-neutral-20 cursor-default"; // Disabled style
                    } else {
                      // minDate && decade.end < getYear(minDate)
                      decadeButtonClasses +=
                        " bg-neutral-10 text-neutral-60 hover:bg-neutral-10 cursor-default"; // Off style
                    }
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
