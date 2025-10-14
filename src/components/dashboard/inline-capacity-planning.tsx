"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from './app-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SequentialAgentWorkflow } from '@/lib/sequential-workflow';

interface InlineCapacityPlanningProps {
  messageId: string;
}

// Helper function to convert week format to ISO date
const weekToISODate = (weekString: string): string => {
  if (!weekString || !weekString.includes('-W')) {
    return weekString; // Already in ISO format
  }
  // Format: YYYY-Www
  const [year, week] = weekString.split('-W');
  const date = new Date(parseInt(year), 0, 1);
  const dayOfWeek = date.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  date.setDate(date.getDate() + daysToMonday + (parseInt(week) - 1) * 7);
  return date.toISOString().split('T')[0];
};

// Helper function to convert ISO date to week format for input
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

export function InlineCapacityPlanning({ messageId }: InlineCapacityPlanningProps) {
  const { state, dispatch } = useApp();
  const [localAssumptions, setLocalAssumptions] = useState(state.capacityPlanning.assumptions);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: state.capacityPlanning.dateRange.startDate 
      ? isoDateToWeek(state.capacityPlanning.dateRange.startDate)
      : '',
    endDate: state.capacityPlanning.dateRange.endDate
      ? isoDateToWeek(state.capacityPlanning.dateRange.endDate)
      : ''
  });
  const resultsPerPage = 10;

  // Update customDateRange when state changes
  useEffect(() => {
    if (state.capacityPlanning.dateRange.startDate && state.capacityPlanning.dateRange.endDate) {
      setCustomDateRange({
        startDate: isoDateToWeek(state.capacityPlanning.dateRange.startDate),
        endDate: isoDateToWeek(state.capacityPlanning.dateRange.endDate)
      });
    }
  }, [state.capacityPlanning.dateRange.startDate, state.capacityPlanning.dateRange.endDate]);

  // Check if capacity planning is enabled
  if (!state.capacityPlanning.enabled) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Please run a forecast first to enable capacity planning
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle assumption change
  const handleAssumptionChange = (field: keyof typeof localAssumptions, value: string) => {
    const numValue = parseFloat(value);
    setLocalAssumptions(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  // Handle assumption blur (save to state)
  const handleAssumptionBlur = () => {
    dispatch({
      type: 'SET_CAPACITY_ASSUMPTIONS',
      payload: localAssumptions
    });
  };

  // Handle date range change
  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Convert to ISO date and update global state
    const isoDate = weekToISODate(value);
    if (field === 'startDate' && customDateRange.endDate) {
      const endIsoDate = weekToISODate(customDateRange.endDate);
      dispatch({
        type: 'SET_CAPACITY_DATE_RANGE',
        payload: { startDate: isoDate, endDate: endIsoDate }
      });
    } else if (field === 'endDate' && customDateRange.startDate) {
      const startIsoDate = weekToISODate(customDateRange.startDate);
      dispatch({
        type: 'SET_CAPACITY_DATE_RANGE',
        payload: { startDate: startIsoDate, endDate: isoDate }
      });
    }
  };

  // Calculate HC
  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      dispatch({ type: 'SET_CAPACITY_STATUS', payload: 'calculating' });

      const timeSeriesData = state.selectedLob?.timeSeriesData || [];
      
      // Convert week format to ISO dates
      const startDateISO = weekToISODate(customDateRange.startDate);
      const endDateISO = weekToISODate(customDateRange.endDate);
      
      console.log('🔍 Capacity Planning Debug:');
      console.log('📊 Total data points:', timeSeriesData.length);
      console.log('📊 Sample data point:', timeSeriesData[0]);
      console.log('📊 Data properties:', timeSeriesData[0] ? Object.keys(timeSeriesData[0]) : 'No data');
      console.log('📅 Week range (input):', customDateRange);
      console.log('📅 Date range (ISO):', { startDateISO, endDateISO });

      if (!customDateRange.startDate || !customDateRange.endDate) {
        throw new Error('Please select both start and end weeks.');
      }

      const workflow = new SequentialAgentWorkflow(
        { selectedBu: state.selectedBu, selectedLob: state.selectedLob },
        timeSeriesData
      );

      // Separate actual and forecasted data
      const actualData = timeSeriesData.filter(d => !d.Forecast || d.Forecast === 0);
      const forecastedData = timeSeriesData.filter(d => d.Forecast && d.Forecast > 0);
      
      console.log('📊 Actual data points:', actualData.length, 'Sample:', actualData[0]);
      console.log('📈 Forecasted data points:', forecastedData.length, 'Sample:', forecastedData[0]);

      workflow['currentState'].forecastResults = {
        forecastPoints: forecastedData.map(d => ({
          date: new Date(d.Date),
          forecast: d.Forecast,
          is_future: true
        }))
      };
      workflow['currentState'].processedData = timeSeriesData;

      console.log('🚀 Starting capacity planning calculation...');
      const results = await workflow.executeCapacityPlanningStep(
        localAssumptions,
        {
          startDate: startDateISO,
          endDate: endDateISO
        }
      );

      console.log('✅ Capacity planning results:', results);

      dispatch({
        type: 'UPDATE_CAPACITY_RESULTS',
        payload: results
      });

    } catch (error) {
      console.error('❌ Capacity planning calculation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({
        type: 'SET_CAPACITY_ERRORS',
        payload: [errorMessage]
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle recalculate
  const handleRecalculate = () => {
    dispatch({ type: 'SET_CAPACITY_STATUS', payload: 'idle' });
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExport = () => {
    const { weeklyHC } = state.capacityPlanning.results;

    const headers = ['Week', 'Volume', 'Required HC', 'Data Type'];
    const rows = weeklyHC.map(week => [
      week.week,
      week.volume,
      week.requiredHC,
      week.dataType === 'actual' ? 'Actual' : 'Forecasted'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `capacity-planning-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date for display (Short: Sep 09, 2025)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Pagination calculations
  const totalResults = state.capacityPlanning.results.weeklyHC.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = state.capacityPlanning.results.weeklyHC.slice(startIndex, endIndex);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Capacity Planning</CardTitle>
          {state.capacityPlanning.status === 'completed' && (
            <Badge className="bg-green-50 text-green-700 border-green-300">
              Calculation Complete
            </Badge>
          )}
          {state.capacityPlanning.status === 'calculating' && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-300">
              Calculating...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display - Alert banner with bulleted list */}
        {state.capacityPlanning.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold mb-1">Validation Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {state.capacityPlanning.errors.map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: 'SET_CAPACITY_ERRORS', payload: [] })}
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Assumptions Configuration - Compact numeric inputs */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Configure Assumptions</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'aht', label: 'AHT (seconds)', unit: 's' },
              { key: 'occupancy', label: 'Occupancy', unit: '%' },
              { key: 'backlog', label: 'Backlog', unit: '%' },
              { key: 'volumeMix', label: 'Volume Mix', unit: '%' },
              { key: 'inOfficeShrinkage', label: 'In-Office Shrinkage', unit: '%' },
              { key: 'outOfOfficeShrinkage', label: 'Out-Office Shrinkage', unit: '%' },
              { key: 'attrition', label: 'Attrition', unit: '%' }
            ].map(({ key, label, unit }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground flex-1">{label}:</label>
                <Input
                  type="number"
                  step="0.1"
                  value={localAssumptions[key as keyof typeof localAssumptions]}
                  onChange={(e) => handleAssumptionChange(key as keyof typeof localAssumptions, e.target.value)}
                  onBlur={handleAssumptionBlur}
                  disabled={isCalculating}
                  className="w-24 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground w-6">{unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range Picker */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Week Range Selection</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Week</label>
              <Input
                type="week"
                value={customDateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="text-sm"
                disabled={isCalculating}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Week</label>
              <Input
                type="week"
                value={customDateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="text-sm"
                disabled={isCalculating}
              />
            </div>
          </div>
          {state.capacityPlanning.dateRange.autoPopulated && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-populated with last 5 historical weeks + all forecasted weeks
            </p>
          )}
        </div>

        {/* Calculate Button */}
        {state.capacityPlanning.status !== 'completed' && (
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || state.capacityPlanning.errors.length > 0}
            className="w-full"
            size="sm"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Required HC'}
          </Button>
        )}

        {/* Results Section */}
        {state.capacityPlanning.status === 'completed' && state.capacityPlanning.results.summary && (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRecalculate} className="flex-1">
                Recalculate
              </Button>
              <Button size="sm" onClick={handleExport} className="flex-1">
                Export CSV
              </Button>
            </div>

            {/* Data Type Notation */}
            <div className="flex items-center gap-4 text-sm p-3 bg-muted/30 rounded-lg">
              <div className="font-semibold">Data Breakdown:</div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-50 text-green-700 border-green-300">
                  Actual
                </Badge>
                <span className="text-muted-foreground">
                  {state.capacityPlanning.results.weeklyHC.filter(w => w.dataType === 'actual').length} weeks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-300">
                  Forecasted
                </Badge>
                <span className="text-muted-foreground">
                  {state.capacityPlanning.results.weeklyHC.filter(w => w.dataType === 'forecasted').length} weeks
                </span>
              </div>
            </div>

            {/* Summary Statistics - Compact Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground">Total HC</div>
                <div className="text-lg font-bold">{state.capacityPlanning.results.summary.totalHC.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg HC</div>
                <div className="text-lg font-bold">{state.capacityPlanning.results.summary.avgHC.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Min / Max</div>
                <div className="text-sm font-semibold">
                  {state.capacityPlanning.results.summary.minHC.value} / {state.capacityPlanning.results.summary.maxHC.value}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Historical Avg</div>
                <div className="text-sm font-semibold">{state.capacityPlanning.results.summary.historicalAvg.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Forecasted Avg</div>
                <div className="text-sm font-semibold">{state.capacityPlanning.results.summary.forecastedAvg.toLocaleString()}</div>
              </div>
            </div>

            {/* HC Trend Chart with Toggle */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Required HC Trend</h4>
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    size="sm"
                    variant={chartType === 'line' ? 'default' : 'ghost'}
                    onClick={() => setChartType('line')}
                    className="h-7 px-3 text-xs"
                  >
                    Line
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === 'bar' ? 'default' : 'ghost'}
                    onClick={() => setChartType('bar')}
                    className="h-7 px-3 text-xs"
                  >
                    Bar
                  </Button>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                {chartType === 'line' ? (
                  <LineChart data={state.capacityPlanning.results.weeklyHC.map(week => ({
                    week: formatDate(week.week),
                    weekRaw: week.week,
                    requiredHC: week.requiredHC,
                    volume: week.volume,
                    dataType: week.dataType
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow-lg text-xs">
                              <p className="font-semibold">{data.week}</p>
                              <p>
                                <span className="text-muted-foreground">Required HC:</span>{' '}
                                <span className="font-semibold">{data.requiredHC}</span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Volume:</span>{' '}
                                {data.volume.toLocaleString()}
                              </p>
                              <Badge
                                className={data.dataType === 'actual' ? 'bg-green-50 text-green-700 text-xs mt-1' : 'bg-blue-50 text-blue-700 text-xs mt-1'}
                              >
                                {data.dataType === 'actual' ? 'Actual' : 'Forecasted'}
                              </Badge>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {(() => {
                      const chartData = state.capacityPlanning.results.weeklyHC.map(week => ({
                        week: formatDate(week.week),
                        dataType: week.dataType
                      }));
                      const splitIndex = chartData.findIndex(d => d.dataType === 'forecasted');
                      return splitIndex > 0 ? (
                        <ReferenceLine
                          x={chartData[splitIndex].week}
                          stroke="#666"
                          strokeDasharray="3 3"
                          label={{ value: 'Forecast Start', position: 'top', fontSize: 10 }}
                        />
                      ) : null;
                    })()}
                    <Line
                      type="monotone"
                      dataKey="requiredHC"
                      stroke="#1976d2"
                      strokeWidth={2}
                      name="Required HC"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={state.capacityPlanning.results.weeklyHC.map(week => ({
                    week: formatDate(week.week),
                    weekRaw: week.week,
                    requiredHC: week.requiredHC,
                    volume: week.volume,
                    dataType: week.dataType
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow-lg text-xs">
                              <p className="font-semibold">{data.week}</p>
                              <p>
                                <span className="text-muted-foreground">Required HC:</span>{' '}
                                <span className="font-semibold">{data.requiredHC}</span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Volume:</span>{' '}
                                {data.volume.toLocaleString()}
                              </p>
                              <Badge
                                className={data.dataType === 'actual' ? 'bg-green-50 text-green-700 text-xs mt-1' : 'bg-blue-50 text-blue-700 text-xs mt-1'}
                              >
                                {data.dataType === 'actual' ? 'Actual' : 'Forecasted'}
                              </Badge>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {(() => {
                      const chartData = state.capacityPlanning.results.weeklyHC.map(week => ({
                        week: formatDate(week.week),
                        dataType: week.dataType
                      }));
                      const splitIndex = chartData.findIndex(d => d.dataType === 'forecasted');
                      return splitIndex > 0 ? (
                        <ReferenceLine
                          x={chartData[splitIndex].week}
                          stroke="#666"
                          strokeDasharray="3 3"
                          label={{ value: 'Forecast Start', position: 'top', fontSize: 10 }}
                        />
                      ) : null;
                    })()}
                    <Bar
                      dataKey="requiredHC"
                      fill="#1976d2"
                      name="Required HC"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Results Table with Strong Section Dividers */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b-2 border-border">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Week</th>
                    <th className="px-3 py-2 text-right font-semibold">Volume</th>
                    <th className="px-3 py-2 text-right font-semibold">Required HC</th>
                    <th className="px-3 py-2 text-center font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {currentResults.map((week, idx) => (
                    <tr
                      key={idx}
                      className={week.dataType === 'forecasted' ? 'bg-muted/50' : ''}
                    >
                      <td className="px-3 py-2 border-t">{formatDate(week.week)}</td>
                      <td className="px-3 py-2 text-right border-t">{week.volume.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-semibold border-t">{week.requiredHC}</td>
                      <td className="px-3 py-2 text-center border-t">
                        <Badge
                          className={week.dataType === 'actual'
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-blue-50 text-blue-700 border-blue-300'
                          }
                        >
                          {week.dataType === 'actual' ? 'Actual' : 'Forecasted'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - Numeric page selector */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults} weeks
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
