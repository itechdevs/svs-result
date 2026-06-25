// @ts-expect-error bikram-sambat doesn't have type definitions
import * as bs from "bikram-sambat";

export function toBSDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const bsDate = bs.toBik(dateString);
  return {
    bsYear: bsDate.year as number,
    bsMonth: bsDate.month as number,
    bsDay: bsDate.day as number,
    monthName: getBSMonthName(bsDate.month).en,
  };
}

export function toADDate(bsYear: number, bsMonth: number, bsDay: number): Date {
  const adDate = bs.toGreg(bsYear, bsMonth, bsDay);
  // adDate.month is 1-indexed (1-12)
  return new Date(adDate.year, adDate.month - 1, adDate.day);
}

export function getBSMonthName(monthNum: number) {
  const enNames = [
    "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
  ];
  const neNames = [
    "बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
    "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुन", "चैत"
  ];
  const index = monthNum - 1;
  return {
    en: enNames[index] || "",
    ne: neNames[index] || "",
  };
}

export function formatBSPeriod(bsYear: number, bsMonth: number): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${bsYear}-${pad(bsMonth)}`;
}

export function parseBSPeriod(period: string) {
  const [y, m] = period.split("-");
  return {
    bsYear: parseInt(y, 10),
    bsMonth: parseInt(m, 10),
  };
}

export function getCurrentBSPeriod(): string {
  const today = new Date();
  const bsDate = toBSDate(today);
  return formatBSPeriod(bsDate.bsYear, bsDate.bsMonth);
}

export function getBSMonthsForYear(bsYear: number) {
  const months = [];
  for (let i = 1; i <= 12; i++) {
    const days = bs.daysInMonth(bsYear, i) as number;
    const adStartDate = toADDate(bsYear, i, 1);
    const adEndDate = toADDate(bsYear, i, days);
    months.push({
      bsMonth: i,
      monthName: getBSMonthName(i),
      days,
      adStartDate,
      adEndDate,
    });
  }
  return months;
}

export function getDaysInBSMonth(bsYear: number, bsMonth: number): number {
  return bs.daysInMonth(bsYear, bsMonth) as number;
}

export function formatToBSDateString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  try {
    const bsDate = toBSDate(d);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${bsDate.bsYear}-${pad(bsDate.bsMonth)}-${pad(bsDate.bsDay)}`;
  } catch (e) {
    return "";
  }
}

export function formatToBSFullString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  try {
    const bsDate = toBSDate(d);
    return `${bsDate.bsDay} ${getBSMonthName(bsDate.bsMonth).ne} ${bsDate.bsYear}`;
  } catch (e) {
    return "";
  }
}
