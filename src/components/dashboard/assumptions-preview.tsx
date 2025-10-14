"use client";

import React, { useState } from 'react';
import { useApp } from './app-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AssumptionsPreviewProps {
  onConfirm: (assumptions: any, dateRange: { startDate: string; endDate: string }) => void;
}

export function AssumptionsPreview({ onConfirm }: AssumptionsPreviewProps) {
  const { state } = useApp();
  const [assumptions, setAssumptions] = useState(state.capacityPlanning.assumptions);
  const [dateRange, setDateRange] = useState({
    startDate: state.capacityPlanning.dateRange.startDate || '',
    endDate: state.capacityPlanning.dateRange.endDate || ''
  });

  const handleAssumptionChange = (field: string, value: string) => {
    const numValue = parseFloat(value);
    setAssumptions(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleConfirm = () => {
    onConfirm(assumptions, dateRange);
  };

  // Convert ISO date to week format
  const isoDateToWeek = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOfWeek = firstDayOfYear.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const firstMonday = new Date(year, 0, 1 + daysToMonday);
    const weekNumber = Math.ceil(((date.getTime() - firstMonday.getTime()) / 86400000 + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  // Convert week format to ISO date
  const weekToISODate = (weekString: string): string => {
    if (!weekString || !weekString.includes('-W')) {
      return weekString;
    }
    const [year, week] = weekString.split('-W');
    const date = new Date(parseInt(year), 0, 1);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    date.setDate(date.getDate() + daysToMonday + (parseInt(week) - 1) * 7);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const isoDate = weekToISODate(value);
    setDateRange(prev => ({
      ...prev,
      [field]: isoDate
    }));
  };

  // Get actual and forecasted counts
  const actualCount = state.selectedLob?.timeSeriesData?.filter(d => !d.Forecast || d.Forecast === 0).length || 0;
  const forecastCount = state.selectedLob?.timeSeriesData?.filter(d => d.Forecast && d.Forecast > 0).length || 0;

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        {/* Data Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-blue-900 mb-2">📊 Data Overview</p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-50 text-green-700 border-green-300">Actual</Badge>
              <span className="text-muted-foreground">{actualCount} weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-700 border-blue-300">Forecasted</Badge>
              <span className="text-muted-foreground">{forecastCount} weeks</span>
            </div>
          </div>
        </div>

        {/* Assumptions Table */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Capacity Planning Assumptions</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Parameter</th>
                  <th className="px-3 py-2 text-center font-semibold">Value</th>
                  <th className="px-3 py-2 text-left font-semibold">Unit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'aht', label: 'Average Handle Time (AHT)', unit: 'seconds' },
                  { key: 'occupancy', label: 'Occupancy', unit: '%' },
                  { key: 'backlog', label: 'Backlog', unit: '%' },
                  { key: 'volumeMix', label: 'Volume Mix', unit: '%' },
                  { key: 'inOfficeShrinkage', label: 'In-Office Shrinkage', unit: '%' },
                  { key: 'outOfOfficeShrinkage', label: 'Out-of-Office Shrinkage', unit: '%' },
                  { key: 'attrition', label: 'Attrition', unit: '%' }
                ].map(({ key, label, unit }) => (
                  <tr key={key} className="border-t">
                    <td className="px-3 py-2">{label}</td>
                    <td className="px-3 py-2 text-center">
                      <Input
                        type="number"
                        step="0.1"
                        value={assumptions[key as keyof typeof assumptions]}
                        onChange={(e) => handleAssumptionChange(key, e.target.value)}
                        className="w-20 h-8 text-center mx-auto"
                      />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Week Range</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Week</label>
              <Input
                type="week"
                value={isoDateToWeek(dateRange.startDate)}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Week</label>
              <Input
                type="week"
                value={isoDateToWeek(dateRange.endDate)}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          {state.capacityPlanning.dateRange.autoPopulated && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-populated: Last 5 historical weeks + all forecasted weeks
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleConfirm} className="flex-1">
            Confirm & Calculate HC
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
