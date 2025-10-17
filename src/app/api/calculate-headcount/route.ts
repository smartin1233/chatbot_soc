import { NextRequest, NextResponse } from 'next/server';
import {
  validateAssumptions,
  validateDateRange,
  calculateWeeklyHC,
  aggregateResults,
} from '@/lib/capacity-planning-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { timeSeriesData, assumptions, dateRange } = body;

    if (!timeSeriesData || !assumptions || !dateRange) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const assumptionValidation = validateAssumptions(assumptions);
    if (!assumptionValidation.valid) {
      return NextResponse.json({ error: `Assumption validation failed: ${assumptionValidation.errors.join(', ')}` }, { status: 400 });
    }

    const historicalData = timeSeriesData.filter((d: any) => !d.Forecast || d.Forecast === 0);
    const forecastData = timeSeriesData.filter((d: any) => d.Forecast && d.Forecast > 0);

    const dateValidation = validateDateRange(
      dateRange,
      historicalData,
      forecastData
    );

    if (!dateValidation.valid) {
      return NextResponse.json({ error: `Date range validation failed: ${dateValidation.errors.join(', ')}` }, { status: 400 });
    }

    const weeklyResults = calculateWeeklyHC(
      assumptions,
      dateValidation.historicalWeeks,
      dateValidation.forecastedWeeks,
      historicalData,
      forecastData
    );

    const aggregated = aggregateResults(weeklyResults);

    return NextResponse.json(aggregated);
  } catch (error) {
    console.error('Error calculating headcount:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: `Failed to calculate headcount: ${errorMessage}` }, { status: 500 });
  }
}