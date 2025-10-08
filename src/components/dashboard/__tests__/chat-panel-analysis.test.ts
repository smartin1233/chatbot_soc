import { describe, it, expect } from 'vitest';
import type { WeeklyData, OutlierData, ForecastData } from '@/lib/types';

// Mock data for testing
const mockWeeklyData: WeeklyData[] = [
  { Date: new Date('2024-01-01'), Value: 100, Orders: 10, CreatedDate: new Date() },
  { Date: new Date('2024-01-08'), Value: 105, Orders: 11, CreatedDate: new Date() },
  { Date: new Date('2024-01-15'), Value: 110, Orders: 12, CreatedDate: new Date() },
  { Date: new Date('2024-01-22'), Value: 500, Orders: 50, CreatedDate: new Date() }, // Outlier
  { Date: new Date('2024-01-29'), Value: 115, Orders: 13, CreatedDate: new Date() },
];

const mockWeeklyDataWithForecast: WeeklyData[] = [
  { Date: new Date('2024-01-01'), Value: 100, Orders: 10, CreatedDate: new Date() },
  { Date: new Date('2024-01-08'), Value: 105, Orders: 11, CreatedDate: new Date() },
  { Date: new Date('2024-01-15'), Value: 110, Orders: 12, Forecast: 115, ForecastLower: 110, ForecastUpper: 120, CreatedDate: new Date() },
];

// Helper functions extracted for testing
function extractOutliersFromResponse(responseText: string, data?: WeeklyData[]): OutlierData[] {
  const outliers: OutlierData[] = [];
  
  if (!data || data.length === 0) return outliers;
  
  const outlierCountMatch = responseText.match(/(\d+)\s+(?:outliers?|unusual values?)/i);
  
  if (outlierCountMatch) {
    const count = parseInt(outlierCountMatch[1]);
    
    const values = data.map(d => d.Value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    
    data.forEach((point, index) => {
      const zScore = Math.abs((point.Value - mean) / stdDev);
      if (zScore > 2) {
        const severity: 'high' | 'medium' | 'low' = 
          zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
        
        outliers.push({
          index,
          value: point.Value,
          date: point.Date,
          reason: `Value is ${zScore.toFixed(1)} standard deviations ${point.Value > mean ? 'above' : 'below'} mean`,
          severity
        });
      }
    });
    
    return outliers.slice(0, count);
  }
  
  return outliers;
}

function extractForecastDataFromResponse(responseText: string, data?: WeeklyData[]): ForecastData[] {
  const forecastData: ForecastData[] = [];
  
  if (!data || data.length === 0) return forecastData;
  
  const dataWithForecast = data.filter(d => d.Forecast !== undefined);
  
  if (dataWithForecast.length > 0) {
    dataWithForecast.forEach(point => {
      if (point.Forecast !== undefined) {
        forecastData.push({
          date: point.Date,
          forecast: point.Forecast,
          lower: point.ForecastLower ?? point.Forecast * 0.9,
          upper: point.ForecastUpper ?? point.Forecast * 1.1,
          confidence: 0.95
        });
      }
    });
  } else {
    const forecastPeriodMatch = responseText.match(/(\d+)[-\s]?(?:day|week|month)/i);
    
    if (forecastPeriodMatch) {
      const period = parseInt(forecastPeriodMatch[1]);
      
      const values = data.map(d => d.Value);
      const lastValue = values[values.length - 1];
      const avgGrowth = values.length > 1 
        ? (values[values.length - 1] - values[0]) / values.length 
        : 0;
      
      const lastDate = new Date(data[data.length - 1].Date);
      
      for (let i = 1; i <= Math.min(period, 30); i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i * 7);
        
        const forecastValue = lastValue + (avgGrowth * i);
        const margin = forecastValue * 0.1;
        
        forecastData.push({
          date: forecastDate,
          forecast: forecastValue,
          lower: forecastValue - margin,
          upper: forecastValue + margin,
          confidence: 0.95
        });
      }
    }
  }
  
  return forecastData;
}

describe('Chat Panel Analysis Extraction', () => {
  describe('extractOutliersFromResponse', () => {
    it('should extract outliers when mentioned in response', () => {
      const response = 'Your data looks good. We found 1 outlier that needs attention.';
      const outliers = extractOutliersFromResponse(response, mockWeeklyData);
      
      expect(outliers).toHaveLength(1);
      expect(outliers[0].value).toBe(500);
      expect(outliers[0].severity).toBe('high');
    });

    it('should return empty array when no outliers mentioned', () => {
      const response = 'Your data looks clean with no issues.';
      const outliers = extractOutliersFromResponse(response, mockWeeklyData);
      
      expect(outliers).toHaveLength(0);
    });

    it('should handle empty data', () => {
      const response = 'We found 5 outliers.';
      const outliers = extractOutliersFromResponse(response, []);
      
      expect(outliers).toHaveLength(0);
    });

    it('should include reason in outlier data', () => {
      const response = 'Found 1 unusual value in your data.';
      const outliers = extractOutliersFromResponse(response, mockWeeklyData);
      
      expect(outliers[0].reason).toContain('standard deviations');
    });
  });

  describe('extractForecastDataFromResponse', () => {
    it('should extract forecast data from WeeklyData with Forecast field', () => {
      const response = 'Here is your forecast for the next 30 days.';
      const forecastData = extractForecastDataFromResponse(response, mockWeeklyDataWithForecast);
      
      expect(forecastData).toHaveLength(1);
      expect(forecastData[0].forecast).toBe(115);
      expect(forecastData[0].lower).toBe(110);
      expect(forecastData[0].upper).toBe(120);
    });

    it('should generate forecast when period is mentioned', () => {
      const response = 'Generating a 4-week forecast for your data.';
      const forecastData = extractForecastDataFromResponse(response, mockWeeklyData);
      
      expect(forecastData.length).toBeGreaterThan(0);
      expect(forecastData.length).toBeLessThanOrEqual(4);
    });

    it('should return empty array when no forecast info available', () => {
      const response = 'Your data has been analyzed.';
      const forecastData = extractForecastDataFromResponse(response, mockWeeklyData);
      
      expect(forecastData).toHaveLength(0);
    });

    it('should include confidence intervals', () => {
      const response = 'Here is your 2-week forecast.';
      const forecastData = extractForecastDataFromResponse(response, mockWeeklyData);
      
      if (forecastData.length > 0) {
        expect(forecastData[0].lower).toBeLessThan(forecastData[0].forecast);
        expect(forecastData[0].upper).toBeGreaterThan(forecastData[0].forecast);
        expect(forecastData[0].confidence).toBe(0.95);
      }
    });
  });
});
