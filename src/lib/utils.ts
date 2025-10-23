import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WeeklyData } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate 5 years of weekly mock data (Date, Value, Orders) with trend, seasonality, and randomness.
 * Value and Orders are units (not price).
 * @param startYear - The starting year for the data (default: 2020)
 * @param weeks - Number of weeks to generate (default: 260)
 * @param baseValue - Starting value for the target (default: 100)
 * @returns WeeklyData[]
 */
export function generateMockWeeklyData(
  startYear: number = 2020,
  weeks: number = 260,
  baseValue: number = 100
): WeeklyData[] {
  const data: WeeklyData[] = [];
  const startDate = new Date(startYear, 0, 1);

  for (let i = 0; i < weeks; i++) {
    // Date for each week
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i * 7);

    // Trend: +2% per year
    const trendMultiplier = 1 + (i / weeks) * 0.10;

    // Seasonality: annual cycle, amplitude 20%
    const seasonality = 1 + 0.2 * Math.sin((2 * Math.PI * i) / 52);

    // Random noise: ±10%
    const randomNoise = 0.9 + Math.random() * 0.2;

    // Value: base * trend * seasonality * noise
    const value = Math.round(baseValue * trendMultiplier * seasonality * randomNoise);

    // Orders: correlated with value, but with its own noise
    const orders = Math.round(value * (0.7 + Math.random() * 0.6));

    data.push({
      Date: date,
      Value: value,
      Orders: orders,
      CreatedDate: new Date(),
    });
  }

  return data;
}
