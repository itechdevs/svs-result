"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  toBSDate,
  toADDate,
  getBSMonthName,
  getDaysInBSMonth,
  formatToBSFullString,
} from "@/lib/bs-calendar";

interface BSCalendarSelectorProps {
  value: string; // AD Gregorian date string in "YYYY-MM-DD" format
  onChange: (value: string) => void; // Called with AD Gregorian date string "YYYY-MM-DD"
  className?: string;
  disabled?: boolean;
}

export function BSCalendarSelector({
  value,
  onChange,
  className,
  disabled = false,
}: BSCalendarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize visibility states
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return toBSDate(parsedDate).bsYear;
      }
    }
    return toBSDate(new Date()).bsYear;
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return toBSDate(parsedDate).bsMonth;
      }
    }
    return toBSDate(new Date()).bsMonth;
  });

  const [yearInput, setYearInput] = useState<string>(() => currentYear.toString());

  // Sync year input state when currentYear changes (e.g. from prev/next buttons)
  useEffect(() => {
    setYearInput(currentYear.toString());
  }, [currentYear]);

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits only
    const cleanVal = val.replace(/\D/g, "");
    setYearInput(cleanVal);
    const parsed = parseInt(cleanVal, 10);
    if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2200) {
      setCurrentYear(parsed);
    }
  };

  const handleYearInputBlur = () => {
    setYearInput(currentYear.toString());
  };

  // Sync state if value prop changes externally
  useEffect(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        const bsDate = toBSDate(parsedDate);
        setCurrentYear(bsDate.bsYear);
        setCurrentMonth(bsDate.bsMonth);
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      if (currentYear > 2070) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      }
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      if (currentYear < 2099) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      }
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const adDate = toADDate(currentYear, currentMonth, day);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${adDate.getFullYear()}-${pad(adDate.getMonth() + 1)}-${pad(adDate.getDate())}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    onChange(dateStr);

    const bsToday = toBSDate(today);
    setCurrentYear(bsToday.bsYear);
    setCurrentMonth(bsToday.bsMonth);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  // Generate grid days for the month
  const numDays = getDaysInBSMonth(currentYear, currentMonth);
  const firstDayAD = toADDate(currentYear, currentMonth, 1);
  const startWeekday = firstDayAD.getDay(); // 0 is Sunday, 1 is Monday, etc.

  const gridDays: ({ day: number; isSelected: boolean; isToday: boolean } | null)[] = [];

  // Padding for starting weekday
  for (let i = 0; i < startWeekday; i++) {
    gridDays.push(null);
  }

  // Parse active selection
  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;
  let selectedDay: number | null = null;

  if (value) {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      const bsSelected = toBSDate(parsedDate);
      selectedYear = bsSelected.bsYear;
      selectedMonth = bsSelected.bsMonth;
      selectedDay = bsSelected.bsDay;
    }
  }

  const todayBS = toBSDate(new Date());

  // Fill in active month days
  for (let d = 1; d <= numDays; d++) {
    const isSelected =
      selectedYear === currentYear &&
      selectedMonth === currentMonth &&
      selectedDay === d;

    const isToday =
      todayBS.bsYear === currentYear &&
      todayBS.bsMonth === currentMonth &&
      todayBS.bsDay === d;

    gridDays.push({
      day: d,
      isSelected,
      isToday,
    });
  }

  // Year list for selector (2070 - 2099 BS)
  const yearsList = Array.from({ length: 30 }, (_, i) => 2070 + i);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Date Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer",
          !value && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <span className="truncate">
          {value ? formatToBSFullString(value) : "Select date (BS)..."}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 mt-1 z-50 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md outline-hidden animate-in fade-in-0 zoom-in-95">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-3 gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="h-7 rounded-md border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-popover text-foreground text-xs">
                    {getBSMonthName(m).en}
                  </option>
                ))}
              </select>

              {/* Year Input (Typeable) */}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={yearInput}
                onChange={handleYearInputChange}
                onBlur={handleYearInputBlur}
                placeholder="Year"
                className="h-7 w-14 rounded-md border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground text-center focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="h-6 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((dayObj, index) => {
              if (!dayObj) {
                return <div key={`empty-${index}`} className="h-8" />;
              }

              const { day, isSelected, isToday } = dayObj;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-8 w-8 text-xs flex items-center justify-center rounded-md transition-all font-medium cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground hover:bg-primary/95 font-bold scale-105 shadow-sm"
                      : isToday
                      ? "bg-accent text-accent-foreground font-semibold ring-1 ring-primary/45"
                      : "hover:bg-accent hover:text-accent-foreground text-foreground"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Popover Footer */}
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="truncate max-w-[130px]">
              {value ? (
                <span className="font-medium text-muted-foreground">{value} AD</span>
              ) : (
                <span className="text-muted-foreground/60">No selection</span>
              )}
            </div>
            <div className="flex gap-2">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-1.5 py-0.5 rounded-md hover:bg-accent hover:text-accent-foreground text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleToday}
                className="px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
