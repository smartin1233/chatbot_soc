"use client";

import React, { useState } from 'react';
import { useApp } from './app-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SequentialAgentWorkflow } from '@/lib/sequential-workflow';

export function CapacityPlanningPanel() {
  const { state, dispatch } = useApp();
  const [localAssumptions, setLocalAssumptions] = useState(state.capacityPlanning.assumptions);
  const [isCalculating, setIsCalculating] = useState(false);

  // Render locked state if not enabled
  if (!state.capacityPlanning.enabled) {
    return (
      <Card className="opacity-50 border-dashed">
        <CardHeader>
          <CardTitle>📊 Step 7: Capacity Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will unlock after forecasting is complete. Please wait for forecasting to finish before calculating headcount.
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

  // Calculate HC
  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      dispatch({ type: 'SET_CAPACITY_STATUS', payload: 'calculating' });

      // Get time series data from selected LOB
      const timeSeriesData = state.selectedLob?.timeSeriesData || [];

      // Validate date range is set
      if (!state.capacityPlanning.dateRange.startDate || !state.capacityPlanning.dateRange.endDate) {
        throw new Error('Date range is not set. Please ensure forecasting has completed successfully.');
      }

      // Create workflow instance
      const workflow = new SequentialAgentWorkflow(
        { selectedBu: state.selectedBu, selectedLob: state.selectedLob },
        timeSeriesData
      );

      // Set the forecast results in workflow state (needed for HC calculation)
      workflow['currentState'].forecastResults = {
        forecastPoints: timeSeriesData.filter(d => d.Forecast && d.Forecast > 0).map(d => ({
          date: new Date(d.Date),
          forecast: d.Forecast,
          is_future: true
        }))
      };
      workflow['currentState'].processedData = timeSeriesData;

      // Execute capacity planning step
      const results = await workflow.executeCapacityPlanningStep(
        localAssumptions,
        {
          startDate: state.capacityPlanning.dateRange.startDate,
          endDate: state.capacityPlanning.dateRange.endDate
        }
      );

      // Update state with results
      dispatch({
        type: 'UPDATE_CAPACITY_RESULTS',
        payload: results
      });

    } catch (error) {
      console.error('Capacity planning calculation failed:', error);
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
  };

  // Export to CSV
  const handleExport = () => {
    const { weeklyHC } = state.capacityPlanning.results;

    // Create CSV content
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

    // Create download link
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

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📊 Step 7: Capacity Planning</CardTitle>
          {state.capacityPlanning.status === 'completed' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              ✅ Calculation Complete
            </Badge>
          )}
          {state.capacityPlanning.status === 'calculating' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              🔄 Calculating...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Display */}
        {state.capacityPlanning.errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">⚠️ Validation Errors:</p>
                  <ul className="list-disc list-inside mt-2">
                    {state.capacityPlanning.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
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

        {/* Assumptions Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📋 Configure Assumptions</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Parameter</th>
                  <th className="px-4 py-2 text-left">Value</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2">Average Handle Time (AHT)</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localAssumptions.aht}
                      onChange={(e) => handleAssumptionChange('aht', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">seconds</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Occupancy</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localAssumptions.occupancy}
                      onChange={(e) => handleAssumptionChange('occupancy', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">%</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Backlog</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localAssumptions.backlog}
                      onChange={(e) => handleAssumptionChange('backlog', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">%</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Volume Mix</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localAssumptions.volumeMix}
                      onChange={(e) => handleAssumptionChange('volumeMix', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">%</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">In-Office Shrinkage</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localAssumptions.inOfficeShrinkage}
                      onChange={(e) => handleAssumptionChange('inOfficeShrinkage', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">%</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Out-of-Office Shrinkage</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localAssumptions.outOfOfficeShrinkage}
                      onChange={(e) => handleAssumptionChange('outOfOfficeShrinkage', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">%</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Attrition</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localAssumptions.attrition}
                      onChange={(e) => handleAssumptionChange('attrition', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Date Range Display */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📅 Date Range</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {state.capacityPlanning.dateRange.startDate && state.capacityPlanning.dateRange.endDate ? (
              <>
                <p className="text-sm text-muted-foreground mb-1">
                  Applying assumptions to:
                </p>
                <p className="text-sm">
                  • <strong>Start Date:</strong> {formatDate(state.capacityPlanning.dateRange.startDate)}
                </p>
                <p className="text-sm">
                  • <strong>End Date:</strong> {formatDate(state.capacityPlanning.dateRange.endDate)}
                </p>
                {state.capacityPlanning.dateRange.autoPopulated && (
                  <p className="text-xs text-muted-foreground mt-2">
                    (Auto-populated with last 5 historical weeks + all forecasted weeks)
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Date range will be auto-populated after forecasting completes
              </p>
            )}
          </div>
        </div>

        {/* Calculate Button */}
        {state.capacityPlanning.status !== 'completed' && (
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || state.capacityPlanning.errors.length > 0}
            className="w-full mb-6"
          >
            {isCalculating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Calculating...
              </>
            ) : (
              'Calculate Required HC'
            )}
          </Button>
        )}

        {/* Results Section */}
        {state.capacityPlanning.status === 'completed' && state.capacityPlanning.results.summary && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">📈 Capacity Planning Results</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRecalculate}>
                  Recalculate
                </Button>
                <Button size="sm" onClick={handleExport}>
                  Export Results
                </Button>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total HC</p>
                      <p className="text-3xl font-bold">{state.capacityPlanning.results.summary.totalHC.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average HC</p>
                      <p className="text-xl font-semibold">{state.capacityPlanning.results.summary.avgHC.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Min HC</p>
                      <p className="text-lg">
                        {state.capacityPlanning.results.summary.minHC.value}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatDate(state.capacityPlanning.results.summary.minHC.week)})
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Max HC</p>
                      <p className="text-xl font-semibold">
                        {state.capacityPlanning.results.summary.maxHC.value}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatDate(state.capacityPlanning.results.summary.maxHC.week)})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Historical Avg HC</p>
                      <p className="text-lg">{state.capacityPlanning.results.summary.historicalAvg.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Forecasted Avg HC</p>
                      <p className="text-lg">{state.capacityPlanning.results.summary.forecastedAvg.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Chart */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-4">Required HC Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
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
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-semibold">{data.week}</p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Required HC:</span>{''}
                              <span className="font-semibold">{data.requiredHC}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Volume:</span>{' '}
                              {data.volume.toLocaleString()}
                            </p>
                            <Badge
                              variant="outline"
                              className={data.dataType === 'actual' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}
                            >
                              {data.dataType === 'actual' ? 'Actual' : 'Forecasted'}
                            </Badge>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
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
                        label={{ value: 'Forecast Start', position: 'top' }}
                      />
                    ) : null;
                  })()}
                  <Line
                    type="monotone"
                    dataKey="requiredHC"
                    stroke="#1976d2"
                    strokeWidth={2}
                    name="Required HC"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Week</th>
                    <th className="px-4 py-2 text-right">Volume</th>
                    <th className="px-4 py-2 text-right">Required HC</th>
                    <th className="px-4 py-2 text-center">Data Type</th>
                  </tr>
                </thead>
                <tbody>
                  {state.capacityPlanning.results.weeklyHC.map((week, idx) => (
                    <tr
                      key={idx}
                      className={`border-t ${week.dataType === 'forecasted' ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <td className="px-4 py-2">{formatDate(week.week)}</td>
                      <td className="px-4 py-2 text-right">{week.volume.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-semibold">{week.requiredHC}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge
                          variant="outline"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
