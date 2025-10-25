import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
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
  isValid,
  getMonth,
  getYear,
  setMonth,
  setYear,
  startOfDecade,
  endOfDecade,
  eachYearOfInterval,
  startOfYear,
  startOfDay,
  isBefore,
  isAfter,
  max,
  min,
} from "date-fns";

/**
 * Props for the useDatePickerPopover hook.
 */
export interface UseDatePickerPopoverProps {
  /** The currently selected date as an ISO 8601 string (e.g., "yyyy-MM-dd") or null. */
  value: string | null;
  /** Callback function triggered when a new date is selected, passing the date as an ISO string. */
  onChange: (date: string) => void;
  /** Optional minimum selectable date as an ISO string. */
  minDateProp?: string;
  /** Optional maximum selectable date as an ISO string. */
  maxDateProp?: string;
  /** Ref to the trigger element (e.g., button) to position the popover against. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Return type of the useDatePickerPopover hook.
 */
export interface UseDatePickerPopoverReturn {
  /** Whether the popover is currently open. */
  isOpen: boolean;
  /** Function to set the popover's open state. */
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** The popover's JSX element (or null) to be rendered via React Portal. */
  popoverElement: React.ReactPortal | null;
  /** The parsed and bounded selected date object. */
  selectedDate: Date | null;
  /** The date object representing the current calendar view (e.g., month/year). */
  currentDate: Date;
  /** The Ref representing the main parents container. */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * A custom hook to manage the state, logic, and rendering of a date picker popover.
 * It handles date calculations, view navigation (day, month, year, decade),
 * and popover positioning.
 *
 * @param {UseDatePickerPopoverProps} props - The props for the hook.
 * @returns {UseDatePickerPopoverReturn} - The state and elements to control the date picker.
 */
export function useDatePickerPopover({
  value,
  onChange,
  minDateProp,
  maxDateProp,
  triggerRef,
}: UseDatePickerPopoverProps): UseDatePickerPopoverReturn {
  // --- Date Prop Parsing ---

  /** Memoized `Date` object for the minimum selectable date, set to start of day. */
  const minDate = useMemo(() => {
    if (!minDateProp) return null;
    const parsed = parseISO(minDateProp);
    return isValid(parsed) ? startOfDay(parsed) : null;
  }, [minDateProp]);

  /** Memoized `Date` object for the maximum selectable date, set to start of day. */
  const maxDate = useMemo(() => {
    if (!maxDateProp) return null;
    const parsed = parseISO(maxDateProp);
    return isValid(parsed) ? startOfDay(parsed) : null;
  }, [maxDateProp]);

  // --- State and Refs ---

  /** State for controlling the popover's visibility. */
  const [isOpen, setIsOpen] = useState(false);
  /** Ref for the popover `div` element, used for click-outside detection. */
  const popoverRef = useRef<HTMLDivElement>(null);
  /** Ref for the main component wrapper `div` element, used for click-outside detection. */
  const containerRef = useRef<HTMLDivElement>(null);
  /** State for the popover's absolute position (top, left). */
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  /** Memoized `Date` object for the selected `value`, bounded by min/max dates. */
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = parseISO(value);
    if (isValid(parsed)) {
      // Ensure the selected date isn't before minDate or after maxDate
      const bounded = minDate && isBefore(parsed, minDate) ? minDate : parsed;
      return maxDate && isAfter(bounded, maxDate) ? maxDate : bounded;
    }
    return null;
  }, [value, minDate, maxDate]);

  /**
   * Calculates the initial date for the calendar view, bounded by min/max dates.
   * Prefers the `selectedDate` if available, otherwise defaults to today.
   */
  const getBoundedInitialDate = useCallback(() => {
    const initial = selectedDate || new Date();
    const afterMin = minDate ? max([initial, minDate]) : initial;
    return maxDate ? min([afterMin, maxDate]) : afterMin;
  }, [selectedDate, minDate, maxDate]);

  /** State for the date the calendar is currently displaying (e.g., the month/year being viewed). */
  const [currentDate, setCurrentDate] = useState(getBoundedInitialDate());
  /** State for the current calendar view ('day', 'month', 'year', 'decade'). */
  const [view, setView] = useState<"day" | "month" | "year" | "decade">("day");

  // --- Effects ---

  /** Effect to reset the `currentDate` if min/max boundaries change. */
  useEffect(() => {
    setCurrentDate(getBoundedInitialDate());
  }, [minDate, maxDate, getBoundedInitialDate]);

  /** Effect to calculate and set the popover's position when it opens. */
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap
        left: rect.left + window.scrollX,
      });
    } else {
      setPopoverPosition(null);
    }
  }, [isOpen, triggerRef]);

  /** Effect to handle clicks outside the popover and trigger to close it. */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, triggerRef, popoverRef]);

  // --- Constants ---

  /** Abbreviated days of the week for the calendar header. */
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
  /** Abbreviated months of the year for the month view. */
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

  /** Memoized 2D array of `Date` objects for the 'day' view grid. */
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

  /** Memoized 2D array of `Date` objects for the 'year' view grid (12 years). */
  const calendarYears = useMemo(() => {
    const decadeStart = startOfDecade(currentDate);
    const decadeEnd = endOfDecade(currentDate);
    // Get 12 years: 1 before decade, 10 for decade, 1 after
    const years = eachYearOfInterval({
      start: subYears(decadeStart, 1),
      end: addYears(decadeEnd, 1),
    });
    const rows: Date[][] = [];
    for (let i = 0; i < years.length; i += 3) {
      rows.push(years.slice(i, i + 3));
    }
    return rows;
  }, [currentDate]);

  /** Memoized 2D array of decade objects (`{start, end}`) for the 'decade' view grid. */
  const calendarDecades = useMemo(() => {
    const currentDecadeStartYear = getYear(startOfDecade(currentDate));
    // Calculate a block of 12 decades centered around the current one
    const startDecadeYear = currentDecadeStartYear - 40; // 4 decades before
    const decades = [];
    for (let i = 0; i < 12; i++) {
      const decadeStart = startDecadeYear + i * 10;
      decades.push({ start: decadeStart, end: decadeStart + 9 });
    }
    const rows: { start: number; end: number }[][] = [];
    for (let i = 0; i < decades.length; i += 3) {
      rows.push(decades.slice(i, i + 3));
    }
    return rows;
  }, [currentDate]);

  /** The start year of the decade currently being viewed (e.g., 2020). */
  const currentViewDecadeStart = getYear(startOfDecade(currentDate));
  /** The end year of the decade currently being viewed (e.g., 2029). */
  const currentViewDecadeEnd = getYear(endOfDecade(currentDate));

  /** Helper to get the full range of decades being displayed for the header. */
  const displayedDecadesFlat = calendarDecades.flat();
  const decadeViewHeaderStart =
    displayedDecadesFlat[0]?.start ?? getYear(currentDate);
  const decadeViewHeaderEnd =
    displayedDecadesFlat[displayedDecadesFlat.length - 1]?.end ??
    getYear(currentDate) + 9;

  // --- Navigation Disable Logic ---

  const canGoPrevMonth =
    !minDate || isAfter(startOfMonth(currentDate), minDate);
  const canGoPrevYear = !minDate || getYear(currentDate) > getYear(minDate);
  const canGoNextMonth =
    !maxDate || isBefore(startOfMonth(currentDate), startOfMonth(maxDate));
  const canGoNextYear = !maxDate || getYear(currentDate) < getYear(maxDate);
  const canGoPrevDecade = !minDate || currentViewDecadeStart > getYear(minDate);
  const canGoNextDecade = !maxDate || currentViewDecadeEnd < getYear(maxDate);
  const canGoPrevDecadeBlock =
    !minDate || currentViewDecadeStart - 100 >= getYear(minDate);
  const canGoNextDecadeBlock =
    !maxDate || currentViewDecadeEnd + 100 <= getYear(maxDate);

  // --- Click Handlers ---

  /** Handles selecting a day. Closes popover and sets view to 'day'. */
  const handleDayClick = useCallback(
    (day: Date) => {
      const dayStart = startOfDay(day);
      if (
        (!minDate || !isBefore(dayStart, minDate)) &&
        (!maxDate || !isAfter(dayStart, maxDate))
      ) {
        onChange(format(day, "yyyy-MM-dd"));
        setIsOpen(false);
        setView("day");
      }
    },
    [minDate, maxDate, onChange]
  );

  /** Handles selecting a month. Sets view to 'day'. */
  const handleMonthClick = useCallback(
    (monthIndex: number) => {
      const targetMonthStart = startOfMonth(setMonth(currentDate, monthIndex));
      if (
        (!minDate || !isBefore(endOfMonth(targetMonthStart), minDate)) &&
        (!maxDate || !isAfter(targetMonthStart, maxDate))
      ) {
        let targetDate = setMonth(currentDate, monthIndex);
        // Bound the date to min/max if necessary
        if (minDate && isBefore(targetDate, minDate)) targetDate = minDate;
        if (maxDate && isAfter(targetDate, maxDate)) targetDate = maxDate;
        setCurrentDate(targetDate);
        setView("day");
      }
    },
    [currentDate, minDate, maxDate]
  );

  /** Handles selecting a year. Sets view to 'month'. */
  const handleYearClick = useCallback(
    (year: number) => {
      if (
        (!minDate || year >= getYear(minDate)) &&
        (!maxDate || year <= getYear(maxDate))
      ) {
        let targetDate = setYear(currentDate, year);
        if (minDate && isBefore(targetDate, minDate)) targetDate = minDate;
        if (maxDate && isAfter(targetDate, maxDate)) targetDate = maxDate;
        setCurrentDate(targetDate);
        setView("month");
      }
    },
    [currentDate, minDate, maxDate]
  );

  /** Handles selecting a decade. Sets view to 'year'. */
  const handleDecadeClick = useCallback(
    (decadeStartYear: number) => {
      const decadeEndYear = decadeStartYear + 9;
      if (
        (!minDate || decadeEndYear >= getYear(minDate)) &&
        (!maxDate || decadeStartYear <= getYear(maxDate))
      ) {
        // Target the start of the decade, but bounded by min/max
        let targetYear = decadeStartYear;
        if (minDate && targetYear < getYear(minDate))
          targetYear = getYear(minDate);
        if (maxDate && targetYear > getYear(maxDate))
          targetYear = getYear(maxDate);

        let targetDate = startOfYear(setYear(currentDate, targetYear));
        if (minDate && isBefore(targetDate, minDate)) targetDate = minDate;
        if (maxDate && isAfter(targetDate, maxDate)) targetDate = maxDate;

        setCurrentDate(targetDate);
        setView("year");
      }
    },
    [currentDate, minDate, maxDate]
  );

  // --- Navigation Functions ---

  const goToNextMonth = useCallback(
    () => canGoNextMonth && setCurrentDate(addMonths(currentDate, 1)),
    [canGoNextMonth, currentDate]
  );
  const goToPrevMonth = useCallback(
    () => canGoPrevMonth && setCurrentDate(subMonths(currentDate, 1)),
    [canGoPrevMonth, currentDate]
  );
  const goToNextYear = useCallback(
    () => canGoNextYear && setCurrentDate(addYears(currentDate, 1)),
    [canGoNextYear, currentDate]
  );
  const goToPrevYear = useCallback(
    () => canGoPrevYear && setCurrentDate(subYears(currentDate, 1)),
    [canGoPrevYear, currentDate]
  );
  const goToNextDecade = useCallback(
    () => canGoNextDecade && setCurrentDate(addYears(currentDate, 10)),
    [canGoNextDecade, currentDate]
  );
  const goToPrevDecade = useCallback(
    () => canGoPrevDecade && setCurrentDate(subYears(currentDate, 10)),
    [canGoPrevDecade, currentDate]
  );
  const goToNextDecadeBlock = useCallback(
    () => canGoNextDecadeBlock && setCurrentDate(addYears(currentDate, 100)),
    [canGoNextDecadeBlock, currentDate]
  );
  const goToPrevDecadeBlock = useCallback(
    () => canGoPrevDecadeBlock && setCurrentDate(subYears(currentDate, 100)),
    [canGoPrevDecadeBlock, currentDate]
  );

  // --- Helpers ---

  /**
   * Helper function to get the appropriate Tailwind classes for a navigation button.
   * @param {boolean} isDisabled - Whether the button should be in a disabled state.
   * @returns {string} - A string of Tailwind classes.
   */
  const getNavButtonClasses = (isDisabled: boolean) => {
    return `p-1 rounded-full cursor-pointer ${
      isDisabled
        ? "text-neutral-60 cursor-not-allowed"
        : "text-neutral-100 hover:bg-neutral-20"
    }`;
  };

  // --- Popover JSX ---

  /** Memoized JSX for the popover's content. */
  const popoverElementInternal = useMemo(() => {
    if (!isOpen || !popoverPosition) return null;

    return (
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-label="Date Picker"
        style={{
          position: "absolute",
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`,
          zIndex: 50,
        }}
        className="w-96 p-6 bg-neutral-10 rounded-2xl shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset[-1px] outline-neutral-40 inline-flex flex-col justify-start items-start gap-6 font-sans"
        onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
      >
        {/* Calendar Header */}
        <div className="self-stretch inline-flex justify-between items-center">
          {/* Previous */}
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
              {" "}
              <UilAngleDoubleLeft size="24" />{" "}
            </button>
            {view === "day" && (
              <button
                type="button"
                onClick={goToPrevMonth}
                disabled={!canGoPrevMonth}
                className={getNavButtonClasses(!canGoPrevMonth)}
                aria-label="Previous month"
              >
                {" "}
                <UilAngleLeft size="24" />{" "}
              </button>
            )}
          </div>
          {/* Title */}
          <div className="flex justify-start items-center gap-4">
            {view === "day" && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => setView("month")}
                  className="cursor-pointer justify-start text-neutral-90 text-lg font-bold hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                  aria-label={`Select month for year ${format(
                    currentDate,
                    "yyyy"
                  )}`}
                >
                  {" "}
                  {format(currentDate, "MMM")}{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={() => setView("year")}
                  className="cursor-pointer justify-start text-neutral-90 text-lg font-bold hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                  aria-label={`Current year ${format(
                    currentDate,
                    "yyyy"
                  )}, select year`}
                >
                  {" "}
                  {format(currentDate, "yyyy")}{" "}
                </button>{" "}
              </>
            )}
            {view === "month" && (
              <button
                type="button"
                onClick={() => setView("year")}
                className="cursor-pointer justify-start text-neutral-90 text-lg font-bold hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                aria-label={`Current year ${format(
                  currentDate,
                  "yyyy"
                )}, select year`}
              >
                {" "}
                {format(currentDate, "yyyy")}{" "}
              </button>
            )}
            {view === "year" && (
              <button
                type="button"
                onClick={() => setView("decade")}
                className="cursor-pointer justify-start text-neutral-90 text-lg font-bold hover:text-primary-main focus:outline-none focus:ring-1 focus:ring-primary-focus rounded px-1"
                aria-label={`Current decade ${currentViewDecadeStart}-${currentViewDecadeEnd}, select decade range`}
              >
                {" "}
                {`${currentViewDecadeStart} - ${currentViewDecadeEnd}`}{" "}
              </button>
            )}
            {view === "decade" && (
              <div className="justify-start text-neutral-90 text-lg font-bold">{`${decadeViewHeaderStart} - ${decadeViewHeaderEnd}`}</div>
            )}
          </div>
          {/* Next */}
          <div className="flex justify-end items-center gap-1">
            {view === "day" && (
              <button
                type="button"
                onClick={goToNextMonth}
                disabled={!canGoNextMonth}
                className={getNavButtonClasses(!canGoNextMonth)}
                aria-label="Next month"
              >
                {" "}
                <UilAngleRight size="24" />{" "}
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
              {" "}
              <UilAngleDoubleRight size="24" />{" "}
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          {/* Day View */}
          {view === "day" && (
            <>
              {" "}
              <div className="self-stretch inline-flex justify-start items-start gap-2">
                {" "}
                {daysOfWeek.map((day, index) => (
                  <div
                    key={`${day}-${index}`}
                    className="flex-1 text-center justify-start text-neutral-100 text-base font-bold"
                    aria-hidden="true"
                  >
                    {day}
                  </div>
                ))}
                <div className="w-0"></div>
              </div>{" "}
              {calendarDays.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="self-stretch inline-flex justify-start items-start gap-2"
                >
                  {" "}
                  {row.map((day, dayIndex) => {
                    const isSelected =
                      selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);
                    const dayStart = startOfDay(day);
                    const isDisabledDay =
                      !isCurrentMonth ||
                      (minDate && isBefore(dayStart, minDate)) ||
                      (maxDate && isAfter(dayStart, maxDate));

                    let dayTextClasses = "text-base font-normal";
                    let dayButtonClasses =
                      "cursor-pointer w-10 h-6 p-2 flex justify-center items-center gap-2 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus";

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
                      dayButtonClasses += " bg-neutral-10 hover:bg-neutral-40";
                    }

                    return (
                      <button
                        type="button"
                        key={dayIndex}
                        className={dayButtonClasses}
                        onClick={() => handleDayClick(day)}
                        disabled={isDisabledDay || false}
                        aria-label={
                          isDisabledDay
                            ? `Date ${format(day, "PPP")} (not selectable)`
                            : `Select ${format(day, "PPP")}`
                        }
                        aria-pressed={isSelected || false}
                      >
                        {" "}
                        <div className={dayTextClasses}>
                          {format(day, "d")}
                        </div>{" "}
                      </button>
                    );
                  })}{" "}
                </div>
              ))}{" "}
            </>
          )}
          {/* Month View */}
          {view === "month" && (
            <div className="grid grid-cols-3 gap-2 w-full">
              {" "}
              {monthsOfYear.map((monthName, monthIndex) => {
                const isCurrentSelectedMonth =
                  getMonth(currentDate) === monthIndex;
                const targetMonthStart = startOfMonth(
                  setMonth(currentDate, monthIndex)
                );
                const targetMonthEnd = endOfMonth(targetMonthStart);
                const isDisabledMonth =
                  (minDate && isBefore(targetMonthEnd, minDate)) ||
                  (maxDate && isAfter(targetMonthStart, maxDate));

                let monthButtonClasses = `cursor-pointer flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus`;
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
                    {" "}
                    <div className="text-center text-base">
                      {monthName}
                    </div>{" "}
                  </button>
                );
              })}{" "}
            </div>
          )}
          {/* Year View */}
          {view === "year" && (
            <div className="grid grid-cols-3 gap-2 w-full">
              {" "}
              {calendarYears.flat().map((yearDate) => {
                const year = getYear(yearDate);
                const isCurrentSelectedYear = getYear(currentDate) === year;
                const isCurrentDecadeYear =
                  year >= currentViewDecadeStart &&
                  year <= currentViewDecadeEnd;
                const isSelectableYear =
                  (!minDate || year >= getYear(minDate)) &&
                  (!maxDate || year <= getYear(maxDate));
                let isDisabled = !isCurrentDecadeYear || !isSelectableYear;

                let yearButtonClasses = `cursor-pointer flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus`;
                let yearTextClasses = "text-center text-base";

                if (!isSelectableYear) {
                  // Not selectable, but could be outside current decade
                  if (maxDate && year > getYear(maxDate)) {
                    yearTextClasses += " text-neutral-50"; // Dimmer for future
                    yearButtonClasses +=
                      " bg-neutral-20 hover:bg-neutral-20 cursor-default";
                  } else {
                    yearTextClasses += " text-neutral-60"; // Standard disabled
                    yearButtonClasses +=
                      " bg-neutral-10 hover:bg-neutral-10 cursor-default";
                  }
                } else if (!isCurrentDecadeYear) {
                  // Selectable, but outside current decade view
                  yearTextClasses += " text-neutral-60";
                  yearButtonClasses +=
                    " bg-neutral-10 hover:bg-neutral-10 cursor-default";
                } else if (isCurrentSelectedYear) {
                  // Current selected year
                  yearTextClasses += " text-primary-main font-bold";
                  yearButtonClasses +=
                    " bg-primary-surface outline outline-1 outline-primary-border hover:bg-primary-surface";
                } else {
                  // Default selectable year
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
                    {" "}
                    <div className={yearTextClasses}>{year}</div>{" "}
                  </button>
                );
              })}{" "}
            </div>
          )}
          {/* Decade View */}
          {view === "decade" && (
            <div className="grid grid-cols-3 gap-2 w-full">
              {" "}
              {calendarDecades.flat().map((decade) => {
                const isCurrentDecadeRange =
                  currentViewDecadeStart >= decade.start &&
                  currentViewDecadeEnd <= decade.end;
                const isSelectableDecade =
                  (!minDate || decade.end >= getYear(minDate)) &&
                  (!maxDate || decade.start <= getYear(maxDate));

                let decadeButtonClasses = `cursor-pointer flex-1 h-10 p-2 rounded-lg flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-focus text-center text-base `;
                let isDisabled = !isSelectableDecade;

                if (isCurrentDecadeRange && isSelectableDecade) {
                  decadeButtonClasses +=
                    " bg-primary-surface text-primary-main font-bold outline outline-1 outline-primary-border hover:bg-primary-surface";
                } else if (isSelectableDecade) {
                  decadeButtonClasses +=
                    " bg-neutral-10 text-neutral-90 hover:bg-neutral-20";
                } else {
                  if (maxDate && decade.start > getYear(maxDate)) {
                    decadeButtonClasses +=
                      " bg-neutral-20 text-neutral-50 hover:bg-neutral-20 cursor-default";
                  } else {
                    decadeButtonClasses +=
                      " bg-neutral-10 text-neutral-60 hover:bg-neutral-10 cursor-default";
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
                    {" "}
                    {`${decade.start}-${decade.end}`}{" "}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    isOpen,
    popoverPosition,
    view,
    currentDate,
    selectedDate,
    minDate,
    maxDate,
    calendarDays,
    calendarYears,
    calendarDecades,
    currentViewDecadeStart,
    currentViewDecadeEnd,
    decadeViewHeaderStart,
    decadeViewHeaderEnd,
    canGoPrevMonth,
    canGoNextMonth,
    canGoPrevYear,
    canGoNextYear,
    canGoPrevDecade,
    canGoNextDecade,
    canGoPrevDecadeBlock,
    canGoNextDecadeBlock,
    handleDayClick,
    handleMonthClick,
    handleYearClick,
    handleDecadeClick,
    goToPrevMonth,
    goToNextMonth,
    goToPrevYear,
    goToNextYear,
    goToPrevDecade,
    goToNextDecade,
    goToPrevDecadeBlock,
    goToNextDecadeBlock,
    setIsOpen,
    setView,
  ]);

  /** Creates the React Portal for the popover element. */
  const popoverPortal =
    // Only create portal if document is available (prevents SSR errors)
    typeof document !== "undefined" && popoverElementInternal
      ? createPortal(popoverElementInternal, document.body)
      : null;

  return {
    isOpen,
    setIsOpen,
    popoverElement: popoverPortal,
    selectedDate,
    currentDate,
    containerRef,
  };
}
