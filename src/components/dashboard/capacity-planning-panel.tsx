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
import type { CapacityAssumptions, DateRange } from '@/lib/capacity-planning-utils';

export function CapacityPlanningPanel() {
  const { state, dispatch } = useApp();
  const [localAssumptions, setLocalAssumptions] = useState(state.capacityPlanning.assumptions);
  const [isCalculating, setIsCalculating] = useState(false);

  // If not enabled, show locked state
  if (!state.capacityPlanning.enabled) {
    return (
      <Card className="opacity-50 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊 Step 7: Capacity Planning</span>
            <Badge variant="outline">Locked</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will unlock after forecasting is complete. Complete the forecasting step to enable capacity planning.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle assumption changes
  const handleAssumptionChange = (field: keyof CapacityAssumptions, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const updated = { ...localAssumptions, [field]: numValue };
      setLocalAssumptions(updated);
    }
  };

  // Handle assumption blur (commit changes to global state)
  const handleAssumptionBlur = () => {
    dispatch({ type: 'SET_CAPACITY_ASSUMPTIONS', payload: localAssumptions });
  };

  // Handle Calculate button click
  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      dispatch({ type: 'SET_CAPACITY_STATUS', payload: 'calculating' });
      dispatch({ type: 'SET_CAPACITY_ERRORS', payload: [] });

      // Validate that we have date range
      if (!state.capacityPlanning.dateRange.startDate || !state.capacityPlanning.dateRange.endDate) {
        throw new Error('Date range is not set. Please ensure forecasting has completed successfully.');
      }

      // Create workflow instance (need to get context)
      const buLobContext = {
        selectedBu: state.selectedBu,
        selectedLob: state.selectedLob
      };

      // Get raw data from selected LOB
      const rawData = state.selectedLob?.timeSeriesData || [];

      if (rawData.length === 0) {
        throw new Error('No data available. Please ensure data has been uploaded and forecasting completed.');
      }

      const workflow = new SequentialAgentWorkflow(buLobContext, rawData);

      // Execute capacity planning step
      const dateRange: DateRange = {
        startDate: state.capacityPlanning.dateRange.startDate,
        endDate: state.capacityPlanning.dateRange.endDate
      };

      const results = await workflow.executeCapacityPlanningStep(localAssumptions, dateRange);

      // Update state with results
      dispatch({ type: 'UPDATE_CAPACITY_RESULTS', payload: results });

    } catch (error) {
      console.error('Capacity planning calculation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_CAPACITY_ERRORS', payload: [errorMessage] });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle recalculate
  const handleRecalculate = () => {
    dispatch({ type: 'SET_CAPACITY_STATUS', payload: 'idle' });
  };

  // Handle export to CSV
  const handleExport = () => {
    const { weeklyHC } = state.capacityPlanning.results;

    // Create CSV content
    const headers = ['Week', 'Volume', 'Required HC', 'Data Type'];
    const rows = weeklyHC.map(w => [
      w.week,
      w.volume.toString(),
      w.requiredHC.toString(),
      w.dataType === 'actual' ? 'Actual' : 'Forecasted'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capacity-planning-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { status, errors, results, dateRange } = state.capacityPlanning;
  const hasResults = status === 'completed' && results.weeklyHC.length > 0;

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Prepare chart data
  const chartData = hasResults ? results.weeklyHC.map(w => ({
    week: formatDate(w.week),
    'Required HC': w.requiredHC,
    volume: w.volume,
    dataType: w.dataType
  })) : [];

  // Find the split point between historical and forecasted data
  const historicalCount = hasResults ? results.weeklyHC.filter(w => w.dataType === 'actual').length : 0;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📊 Step 7: Capacity Planning
            {status === 'completed' && <Badge variant="default">✅ Complete</Badge>}
            {status === 'calculating' && <Badge variant="secondary">⏳ Calculating...</Badge>}
            {status === 'error' && <Badge variant="destructive">❌ Error</Badge>}
            {status === 'idle' && <Badge variant="outline">Ready</Badge>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Error Display */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="font-semibold mb-2">⚠️ Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Assumptions Configuration */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📋 Configure Assumptions</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Parameter</th>
                  <th className="text-left p-3 font-medium">Value</th>
                  <th className="text-left p-3 font-medium">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3">Average Handle Time (AHT)</td>
                  <td className="p-3">
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
                  <td className="p-3 text-muted-foreground">seconds</td>
                </tr>
                <tr>
                  <td className="p-3">Occupancy</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={localAssumptions.occupancy}
                      onChange={(e) => handleAssumptionChange('occupancy', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">%</td>
                </tr>
                <tr>
                  <td className="p-3">Backlog</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={localAssumptions.backlog}
                      onChange={(e) => handleAssumptionChange('backlog', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">%</td>
                </tr>
                <tr>
                  <td className="p-3">Volume Mix</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={localAssumptions.volumeMix}
                      onChange={(e) => handleAssumptionChange('volumeMix', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">%</td>
                </tr>
                <tr>
                  <td className="p-3">In-Office Shrinkage</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={localAssumptions.inOfficeShrinkage}
                      onChange={(e) => handleAssumptionChange('inOfficeShrinkage', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">%</td>
                </tr>
                <tr>
                  <td className="p-3">Out-of-Office Shrinkage</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={localAssumptions.outOfOfficeShrinkage}
                      onChange={(e) => handleAssumptionChange('outOfOfficeShrinkage', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">%</td>
                </tr>
                <tr>
                  <td className="p-3">Attrition</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={localAssumptions.attrition}
                      onChange={(e) => handleAssumptionChange('attrition', e.target.value)}
                      onBlur={handleAssumptionBlur}
                      disabled={isCalculating}
                      className="w-32"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Date Range Display */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📅 Date Range</h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              • <span className="font-medium">Start Date:</span> {formatDate(dateRange.startDate)}
            </p>
            <p className="text-sm">
              • <span className="font-medium">End Date:</span> {formatDate(dateRange.endDate)}
            </p>
            {dateRange.autoPopulated && (
              <p className="text-xs text-muted-foreground italic">
                (Auto-populated: Last 5 historical weeks + all forecasted weeks)
              </p>
            )}
          </div>
        </div>

        {/* Calculate Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || errors.length > 0}
            className="w-full sm:w-auto"
            size="lg"
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

          {hasResults && (
            <Button
              onClick={handleRecalculate}
              variant="outline"
              disabled={isCalculating}
            >
              Recalculate
            </Button>
          )}
        </div>

        {/* Results Display */}
        {hasResults && (
          <>
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">📈 Capacity Planning Results</h3>
                <Button onClick={handleExport} variant="outline" size="sm">
                  📥 Export Results
                </Button>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {results.summary?.totalHC.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Total HC Required</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {results.summary?.avgHC.toFixed(1) || 0}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Average HC per Week</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {results.summary?.minHC.value} - {results.summary?.maxHC.value}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">HC Range (Min-Max)</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-semibold mb-2">Historical Average</div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary?.historicalAvg.toFixed(1) || 0} HC
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Based on {results.weeklyHC.filter(w => w.dataType === 'actual').length} actual weeks
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-semibold mb-2">Forecasted Average</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {results.summary?.forecastedAvg.toFixed(1) || 0} HC
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Based on {results.weeklyHC.filter(w => w.dataType === 'forecasted').length} forecasted weeks
                  </div>
                </div>
              </div>

              {/* Results Chart */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Required HC Trend</h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="week"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={Math.floor(chartData.length / 10) || 0}
                      />
                      <YAxis label={{ value: 'Required HC', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border rounded-lg shadow-lg p-3">
                                <p className="font-semibold">{data.week}</p>
                                <p className="text-sm">Volume: {data.volume.toLocaleString()}</p>
                                <p className="text-sm font-bold">Required HC: {data['Required HC']}</p>
                                <p className="text-xs text-muted-foreground capitalize">{data.dataType}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      {historicalCount > 0 && historicalCount < chartData.length && (
                        <ReferenceLine
                          x={chartData[historicalCount - 1]?.week}
                          stroke="#888"
                          strokeDasharray="5 5"
                          label={{ value: 'Historical → Forecast', position: 'top' }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="Required HC"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Results Table */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Weekly HC Breakdown</h4>
                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Week</th>
                        <th className="text-right p-3 font-medium">Volume</th>
                        <th className="text-right p-3 font-medium">Required HC</th>
                        <th className="text-center p-3 font-medium">Data Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results.weeklyHC.map((week, idx) => (
                        <tr
                          key={idx}
                          className={week.dataType === 'actual' ? 'bg-white' : 'bg-muted/30'}
                        >
                          <td className="p-3">{formatDate(week.week)}</td>
                          <td className="p-3 text-right">{week.volume.toLocaleString()}</td>
                          <td className="p-3 text-right font-semibold">{week.requiredHC}</td>
                          <td className="p-3 text-center">
                            <Badge variant={week.dataType === 'actual' ? 'default' : 'secondary'}>
                              {week.dataType === 'actual' ? 'Actual' : 'Forecasted'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
