/**
 * Forecast Horizon Calculator
 * Handles conversion between user requests (days) and actual forecast periods based on data frequency
 */

export type DataFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ForecastHorizonConfig {
  requestedDays: number;
  dataFrequency: DataFrequency;
  forecastPeriods: number;
  forecastLabel: string;
}

/**
 * Detect data frequency from time series data
 * Analyzes intervals between consecutive dates to determine if data is daily, weekly, monthly, or quarterly
 */
export function detectDataFrequency(dates: Date[]): DataFrequency {
  if (dates.length < 2) return 'daily';
  
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];
  
  // Sample up to 10 intervals to determine frequency
  for (let i = 1; i < Math.min(sortedDates.length, 10); i++) {
    const daysDiff = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(daysDiff);
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  
  // Classify based on average interval
  if (avgInterval <= 1.5) return 'daily';
  if (avgInterval <= 10) return 'weekly';  // 7 days ± 3 days tolerance
  if (avgInterval <= 35) return 'monthly'; // 30 days ± 5 days tolerance
  return 'quarterly';
}

/**
 * Calculate forecast horizon respecting data frequency
 * Converts user's day-based request to appropriate number of periods
 * 
 * Examples:
 * - Weekly data + 30 days request = 4 weeks
 * - Daily data + 30 days request = 30 days
 * - Monthly data + 90 days request = 3 months
 */
export function calculateForecastHorizon(
  requestedDays: number,
  dataFrequency: DataFrequency
): ForecastHorizonConfig {
  let forecastPeriods: number;
  let forecastLabel: string;
  
  switch (dataFrequency) {
    case 'daily':
      forecastPeriods = requestedDays;
      forecastLabel = `${requestedDays} days`;
      break;
      
    case 'weekly':
      forecastPeriods = Math.ceil(requestedDays / 7);
      forecastLabel = `${forecastPeriods} weeks (${requestedDays} days)`;
      break;
      
    case 'monthly':
      forecastPeriods = Math.ceil(requestedDays / 30);
      forecastLabel = `${forecastPeriods} months (${requestedDays} days)`;
      break;
      
    case 'quarterly':
      forecastPeriods = Math.ceil(requestedDays / 90);
      forecastLabel = `${forecastPeriods} quarters (${requestedDays} days)`;
      break;
  }
  
  return {
    requestedDays,
    dataFrequency,
    forecastPeriods,
    forecastLabel
  };
}

/**
 * Parse user request for forecast horizon
 * Extracts number of days from various user input formats
 * 
 * Examples:
 * - "30 days" -> 30
 * - "4 weeks" -> 28
 * - "3 months" -> 90
 * - "1 quarter" -> 90
 * - "forecast for 2 weeks" -> 14
 */
export function parseUserForecastRequest(userMessage: string): number {
  const lowerMessage = userMessage.toLowerCase();
  
  // Match patterns like "30 days", "4 weeks", "3 months"
  const dayMatch = lowerMessage.match(/(\d+)\s*days?/);
  if (dayMatch) return parseInt(dayMatch[1]);
  
  const weekMatch = lowerMessage.match(/(\d+)\s*weeks?/);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;
  
  const monthMatch = lowerMessage.match(/(\d+)\s*months?/);
  if (monthMatch) return parseInt(monthMatch[1]) * 30;
  
  const quarterMatch = lowerMessage.match(/(\d+)\s*quarters?/);
  if (quarterMatch) return parseInt(quarterMatch[1]) * 90;
  
  // Default to 30 days if no specific period mentioned
  return 30;
}

/**
 * Generate forecast dates based on data frequency
 * Creates array of future dates at appropriate intervals
 * 
 * For weekly data starting on Sunday, generates next Sundays
 * For monthly data, generates same day of next months
 */
export function generateForecastDates(
  lastActualDate: Date,
  forecastPeriods: number,
  dataFrequency: DataFrequency
): Date[] {
  const forecastDates: Date[] = [];
  let currentDate = new Date(lastActualDate);
  
  for (let i = 1; i <= forecastPeriods; i++) {
    switch (dataFrequency) {
      case 'daily':
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        break;
        
      case 'weekly':
        // Add 7 days to maintain same day of week
        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
        
      case 'monthly':
        // Add 1 month, handling month-end edge cases
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
        
      case 'quarterly':
        // Add 3 months
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
    }
    
    forecastDates.push(new Date(currentDate));
  }
  
  return forecastDates;
}

/**
 * Format forecast horizon for display
 * Creates user-friendly labels for forecast periods
 */
export function formatForecastHorizon(
  forecastPeriods: number,
  dataFrequency: DataFrequency
): string {
  switch (dataFrequency) {
    case 'daily':
      return `${forecastPeriods} day${forecastPeriods !== 1 ? 's' : ''}`;
    case 'weekly':
      return `${forecastPeriods} week${forecastPeriods !== 1 ? 's' : ''}`;
    case 'monthly':
      return `${forecastPeriods} month${forecastPeriods !== 1 ? 's' : ''}`;
    case 'quarterly':
      return `${forecastPeriods} quarter${forecastPeriods !== 1 ? 's' : ''}`;
  }
}
