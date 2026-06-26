"use client";

import React, { useState, useRef, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  toBSDate,
  toADDate,
  getBSMonthName,
  getDaysInBSMonth,
  formatToBSFullString,
} from "@/lib/bs-calendar";
import { DialogCalendarPortalContext } from "@/components/shared/ui/dialog";

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // When inside a Dialog, portal the calendar into the dialog's own Radix portal
  // container so Radix DismissableLayer doesn't block pointer events.
  const dialogPortalContainer = useContext(DialogCalendarPortalContext);

  // Parse "YYYY-MM-DD" as local time to avoid UTC off-by-one in positive-offset timezones
  const parseLocalDate = (v: string): Date | null => {
    const [y, m, d] = v.split("-").map(Number);
    if (!y || !m || !d) return null;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (value) {
      const parsedDate = parseLocalDate(value);
      if (parsedDate) return toBSDate(parsedDate).bsYear;
    }
    return toBSDate(new Date()).bsYear;
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (value) {
      const parsedDate = parseLocalDate(value);
      if (parsedDate) return toBSDate(parsedDate).bsMonth;
    }
    return toBSDate(new Date()).bsMonth;
  });

  const [yearInput, setYearInput] = useState<string>(() => currentYear.toString());

  useEffect(() => { setYearInput(currentYear.toString()); }, [currentYear]);

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanVal = e.target.value.replace(/\D/g, "");
    setYearInput(cleanVal);
    const parsed = parseInt(cleanVal, 10);
    if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2200) setCurrentYear(parsed);
  };

  // Sync state if value prop changes externally
  useEffect(() => {
    if (value) {
      const parsedDate = parseLocalDate(value);
      if (parsedDate) {
        const bsDate = toBSDate(parsedDate);
        setCurrentYear(bsDate.bsYear);
        setCurrentMonth(bsDate.bsMonth);
      }
    }
  }, [value]);

  // Position popover relative to button using fixed coords
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const goUp = spaceBelow < popoverHeight && rect.top > spaceBelow;

      setPopoverStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 288), // min 288 = w-72
        ...(goUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on scroll/resize to avoid stale position, but not when scrolling inside the calendar
  useEffect(() => {
    if (!isOpen) return;
    const close = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      if (currentYear > 2070) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      if (currentYear < 2099) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const adDate = toADDate(currentYear, currentMonth, day);
    const pad = (n: number) => n.toString().padStart(2, "0");
    onChange(`${adDate.getFullYear()}-${pad(adDate.getMonth() + 1)}-${pad(adDate.getDate())}`);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    onChange(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
    const bsToday = toBSDate(today);
    setCurrentYear(bsToday.bsYear);
    setCurrentMonth(bsToday.bsMonth);
    setIsOpen(false);
  };

  const handleClear = () => { onChange(""); setIsOpen(false); };

  // Build grid
  const numDays = getDaysInBSMonth(currentYear, currentMonth);
  const startWeekday = toADDate(currentYear, currentMonth, 1).getDay();

  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;
  let selectedDay: number | null = null;
  if (value) {
    const p = parseLocalDate(value);
    if (p) {
      const bs = toBSDate(p);
      selectedYear = bs.bsYear; selectedMonth = bs.bsMonth; selectedDay = bs.bsDay;
    }
  }
  const todayBS = toBSDate(new Date());

  const gridDays: ({ day: number; isSelected: boolean; isToday: boolean } | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: numDays }, (_, i) => {
      const d = i + 1;
      return {
        day: d,
        isSelected: selectedYear === currentYear && selectedMonth === currentMonth && selectedDay === d,
        isToday: todayBS.bsYear === currentYear && todayBS.bsMonth === currentMonth && todayBS.bsDay === d,
      };
    }),
  ];

  const popover = (
    <div
      ref={popoverRef}
      data-bs-calendar
      style={{ ...popoverStyle, pointerEvents: "auto" }}
      className="w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-1">
        <button type="button" onClick={handlePrevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className="h-7 rounded-md border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground cursor-pointer">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{getBSMonthName(m).en}</option>
            ))}
          </select>
          <input type="text" inputMode="numeric" pattern="[0-9]*"
            value={yearInput}
            onChange={handleYearInputChange}
            onBlur={() => setYearInput(currentYear.toString())}
            className="h-7 w-14 rounded-md border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground text-center focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <button type="button" onClick={handleNextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="h-6 flex items-center justify-center">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((dayObj, i) =>
          !dayObj ? <div key={`e-${i}`} className="h-8" /> : (
            <button key={`d-${dayObj.day}`} type="button" onClick={() => handleSelectDay(dayObj.day)}
              className={cn(
                "h-8 w-8 text-xs flex items-center justify-center rounded-md transition-all font-medium cursor-pointer",
                dayObj.isSelected
                  ? "bg-primary text-primary-foreground font-bold scale-105 shadow-sm"
                  : dayObj.isToday
                  ? "bg-accent text-accent-foreground font-semibold ring-1 ring-primary/45"
                  : "hover:bg-accent hover:text-accent-foreground text-foreground"
              )}>
              {dayObj.day}
            </button>
          )
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate max-w-[130px] font-medium">{value ? `${value} AD` : ""}</span>
        <div className="flex gap-2">
          {value && (
            <button type="button" onClick={handleClear}
              className="px-1.5 py-0.5 rounded-md hover:bg-accent text-[10px] font-bold cursor-pointer">
              Clear
            </button>
          )}
          <button type="button" onClick={handleToday}
            className="px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold cursor-pointer">
            Today
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">
          {value ? formatToBSFullString(value) : "Select date (BS)..."}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {isOpen && typeof document !== "undefined" &&
        createPortal(popover, dialogPortalContainer ?? document.body)}
    </div>
  );
}
