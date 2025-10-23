// Capacity Planning Utility Functions
// These functions support the capacity planning orchestration

// ==================== Type Definitions ====================

export interface CapacityAssumptions {
  aht: number;                    // Average Handle Time in seconds
  occupancy: number;              // Occupancy % (0-100)
  backlog: number;                // Backlog % (0-100)
  attrition: number;              // Attrition % (0-100)
  volumeMix: number;              // Volume Mix % (0-100)
  inOfficeShrinkage: number;      // In-Office Shrinkage % (0-100)
  outOfOfficeShrinkage: number;   // Out-of-Office Shrinkage % (0-100)
}

export interface DateRange {
  startDate: string;  // ISO format YYYY-MM-DD
  endDate: string;    // ISO format YYYY-MM-DD
}

export interface WeeklyHCResult {
  week: string;              // ISO week start date YYYY-MM-DD
  volume: number;            // Volume for that week
  requiredHC: number;        // Calculated HC (rounded integer)
  dataType: 'actual' | 'forecasted';
}

export interface SummaryStats {
  totalHC: number;
  avgHC: number;
  minHC: { value: number; week: string };
  maxHC: { value: number; week: string };
  historicalAvg: number;
  forecastedAvg: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DateRangeValidationResult extends ValidationResult {
  historicalWeeks: string[];
  forecastedWeeks: string[];
}

// ==================== Validation Functions ====================

/**
 * Validates capacity planning assumptions
 * @param assumptions - The assumptions object to validate
 * @returns ValidationResult with valid flag and error messages
 */
export function validateAssumptions(assumptions: CapacityAssumptions): ValidationResult {
  const errors: string[] = [];

  // AHT: Must be positive number > 0
  if (!assumptions.aht || assumptions.aht <= 0) {
    errors.push('AHT must be greater than 0');
  }

  // Occupancy: Must be 0-100%
  if (assumptions.occupancy < 0 || assumptions.occupancy > 100) {
    errors.push('Occupancy must be between 0 and 100');
  }

  // Backlog: Must be 0-100%
  if (assumptions.backlog < 0 || assumptions.backlog > 100) {
    errors.push('Backlog must be between 0 and 100');
  }

  // Volume Mix: Must be 0-100%
  if (assumptions.volumeMix < 0 || assumptions.volumeMix > 100) {
    errors.push('Volume Mix must be between 0 and 100');
  }

  // In-Office Shrinkage: Must be 0-100%
  if (assumptions.inOfficeShrinkage < 0 || assumptions.inOfficeShrinkage > 100) {
    errors.push('In-Office Shrinkage must be between 0 and 100');
  }

  // Out-of-Office Shrinkage: Must be 0-100%
  if (assumptions.outOfOfficeShrinkage < 0 || assumptions.outOfOfficeShrinkage > 100) {
    errors.push('Out-of-Office Shrinkage must be between 0 and 100');
  }

  // Attrition: Must be 0-100%
  if (assumptions.attrition < 0 || assumptions.attrition > 100) {
    errors.push('Attrition must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates date range and separates historical vs forecasted weeks
 * @param dateRange - The date range to validate
 * @param historicalData - Array of historical data points
 * @param forecastData - Array of forecast data points
 * @returns DateRangeValidationResult with weeks categorized
 */
export function validateDateRange(
  dateRange: DateRange,
  historicalData: any[],
  forecastData: any[]
): DateRangeValidationResult {
  const errors: string[] = [];
  const historicalWeeks: string[] = [];
  const forecastedWeeks: string[] = [];

  // Parse dates
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  // Validate startDate < endDate
  if (startDate >= endDate) {
    errors.push('Start date must be before end date');
    return { valid: false, errors, historicalWeeks, forecastedWeeks };
  }

  // Generate list of weeks between dates
  const weeks: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const weekStr = currentDate.toISOString().split('T')[0];
    weeks.push(weekStr);
    currentDate.setDate(currentDate.getDate() + 7); // Move to next week
  }

  // Create date lookup maps for faster searching
  const historicalDateMap = new Map(
    historicalData.map(d => [
      new Date(d.Date || d.date || d.week).toISOString().split('T')[0],
      d
    ])
  );

  const forecastDateMap = new Map(
    forecastData.map(d => [
      new Date(d.Date || d.date || d.week).toISOString().split('T')[0],
      d
    ])
  );

  // Categorize each week
  for (const week of weeks) {
    if (historicalDateMap.has(week)) {
      historicalWeeks.push(week);
    } else if (forecastDateMap.has(week)) {
      forecastedWeeks.push(week);
    }
    // If week doesn't exist in either dataset, skip it
  }

  // Validate at least 1 week selected
  if (historicalWeeks.length === 0 && forecastedWeeks.length === 0) {
    errors.push('Date range must include at least 1 week with data');
  }

  return {
    valid: errors.length === 0,
    errors,
    historicalWeeks,
    forecastedWeeks
  };
}

// ==================== Calculation Functions ====================

/**
 * Calculates required HC for each week using the capacity planning formula
 * @param assumptions - Validated assumptions
 * @param historicalWeeks - Array of historical week dates
 * @param forecastedWeeks - Array of forecasted week dates
 * @param historicalData - Historical data points
 * @param forecastData - Forecast data points
 * @returns Array of weekly HC results
 */
export function calculateWeeklyHC(
  assumptions: CapacityAssumptions,
  historicalWeeks: string[],
  forecastedWeeks: string[],
  historicalData: any[],
  forecastData: any[]
): WeeklyHCResult[] {
  const results: WeeklyHCResult[] = [];

  // Combine all data for easier lookup
  const allData = [...historicalData, ...forecastData];
  
  // Create lookup map
  const dataMap = new Map(
    allData.map(d => [
      new Date(d.Date || d.date || d.week).toISOString().split('T')[0],
      d
    ])
  );

  // Get all unique weeks from both ranges
  const allWeeks = [...new Set([...historicalWeeks, ...forecastedWeeks])].sort();

  console.log(`📊 Processing ${allWeeks.length} total weeks...`);

  // Process all weeks
  for (const week of allWeeks) {
    const dataPoint = dataMap.get(week);
    if (!dataPoint) {
      console.log(`⚠️ No data found for week: ${week}`);
      continue;
    }

    // Determine data type based on presence of Forecast value
    const hasForecastValue = dataPoint.Forecast !== undefined && 
                            dataPoint.Forecast !== null && 
                            dataPoint.Forecast > 0;
    
    const dataType: 'actual' | 'forecasted' = hasForecastValue ? 'forecasted' : 'actual';
    
    // Extract volume based on data type
    let volume = 0;
    if (dataType === 'forecasted') {
      // For forecasted data, use Forecast field
      volume = dataPoint.Forecast || dataPoint.forecast || dataPoint.predicted || 0;
    } else {
      // For actual data, use Units or Value fields
      volume = dataPoint.Units || dataPoint.Value || dataPoint.volume || dataPoint.value || 0;
    }
    
    console.log(`📊 Week ${week}:`, {
      dataType,
      hasForecastValue,
      volume,
      availableFields: Object.keys(dataPoint),
      Forecast: dataPoint.Forecast,
      Units: dataPoint.Units,
      Value: dataPoint.Value
    });

    if (volume > 0) {
      const requiredHC = calculateHCForWeek(volume, assumptions);
      console.log(`✅ Calculated HC for ${week}: type=${dataType}, volume=${volume}, HC=${requiredHC}`);
      results.push({
        week,
        volume,
        requiredHC,
        dataType
      });
    } else {
      console.log(`⚠️ Zero volume for week ${week} (type: ${dataType})`);
    }
  }

  console.log(`📊 Total HC results calculated: ${results.length} weeks`);
  console.log(`   Actual: ${results.filter(r => r.dataType === 'actual').length} weeks`);
  console.log(`   Forecasted: ${results.filter(r => r.dataType === 'forecasted').length} weeks`);

  // Sort results by week (ascending)
  results.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

  return results;
}

/**
 * Calculates required HC for a single week using the capacity planning formula
 * Formula: HC = (Volume × VolumeMix% × AHT) / (60 × Occupancy% × (1 - InShrinkage%) × (1 - OutShrinkage%)) × (1 + Backlog%) / 40
 * @param volume - Volume for the week
 * @param assumptions - Capacity assumptions
 * @returns Rounded HC value
 */
function calculateHCForWeek(volume: number, assumptions: CapacityAssumptions): number {
  const {
    aht,
    occupancy,
    backlog,
    volumeMix,
    inOfficeShrinkage,
    outOfOfficeShrinkage
  } = assumptions;

  // Convert percentages to decimals
  const occupancyDecimal = occupancy / 100;
  const backlogDecimal = backlog / 100;
  const volumeMixDecimal = volumeMix / 100;
  const inShrinkageDecimal = inOfficeShrinkage / 100;
  const outShrinkageDecimal = outOfOfficeShrinkage / 100;

  // Apply formula
  const numerator = volume * volumeMixDecimal * aht;
  const denominator = 60 * occupancyDecimal * (1 - inShrinkageDecimal) * (1 - outShrinkageDecimal);
  const backlogMultiplier = 1 + backlogDecimal;
  const hoursPerWeek = 40;

  const hc = (numerator / denominator) * backlogMultiplier / hoursPerWeek;

  // Round to nearest integer
  return Math.round(hc);
}

// ==================== Aggregation Functions ====================

/**
 * Aggregates weekly HC results into summary statistics
 * @param weeklyHC - Array of weekly HC results
 * @returns Object with weeklyHC and summary statistics
 */
export function aggregateResults(weeklyHC: WeeklyHCResult[]): {
  weeklyHC: WeeklyHCResult[];
  summary: SummaryStats;
} {
  if (weeklyHC.length === 0) {
    return {
      weeklyHC: [],
      summary: {
        totalHC: 0,
        avgHC: 0,
        minHC: { value: 0, week: '' },
        maxHC: { value: 0, week: '' },
        historicalAvg: 0,
        forecastedAvg: 0
      }
    };
  }

  // Calculate total HC
  const totalHC = weeklyHC.reduce((sum, week) => sum + week.requiredHC, 0);

  // Calculate average HC
  const avgHC = totalHC / weeklyHC.length;

  // Find min HC
  const minWeek = weeklyHC.reduce((min, week) =>
    week.requiredHC < min.requiredHC ? week : min
  );
  const minHC = { value: minWeek.requiredHC, week: minWeek.week };

  // Find max HC
  const maxWeek = weeklyHC.reduce((max, week) =>
    week.requiredHC > max.requiredHC ? week : max
  );
  const maxHC = { value: maxWeek.requiredHC, week: maxWeek.week };

  // Calculate historical average
  const historicalWeeks = weeklyHC.filter(w => w.dataType === 'actual');
  const historicalAvg = historicalWeeks.length > 0
    ? historicalWeeks.reduce((sum, w) => sum + w.requiredHC, 0) / historicalWeeks.length
    : 0;

  // Calculate forecasted average
  const forecastedWeeks = weeklyHC.filter(w => w.dataType === 'forecasted');
  const forecastedAvg = forecastedWeeks.length > 0
    ? forecastedWeeks.reduce((sum, w) => sum + w.requiredHC, 0) / forecastedWeeks.length
    : 0;

  return {
    weeklyHC,
    summary: {
      totalHC: Math.round(totalHC),
      avgHC: Math.round(avgHC * 10) / 10, // Round to 1 decimal
      minHC,
      maxHC,
      historicalAvg: Math.round(historicalAvg * 10) / 10,
      forecastedAvg: Math.round(forecastedAvg * 10) / 10
    }
  };
}
