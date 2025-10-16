"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/dashboard/app-provider";
import BuLobSelector from "./bu-lob-selector";
import EnhancedDataVisualizer from "./enhanced-data-visualizer";
import { Calendar } from "@/components/ui/calendar";
import { addDays, isAfter, isBefore } from "date-fns";
import { statisticalAnalyzer, insightsGenerator, type DataPoint } from "@/lib/statistical-analysis";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  BarChart3, PieChart, LineChart, Activity, Target,
  Zap, Brain, Eye, Download, RefreshCw, Filter
} from "lucide-react";

interface EnhancedMetrics {
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  actionable: boolean;
  recommendation?: string;
}

export default function EnhancedDataPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  // Default to last 1 year for date range
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setFullYear(defaultEnd.getFullYear() - 1);

  const [localDateRange, setLocalDateRange] = useState<{ start: Date; end: Date }>({
    start: state.dateRange?.start || defaultStart,
    end: state.dateRange?.end || defaultEnd,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsResults, setAnalyticsResults] = useState<any>(null);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Enhanced data processing
  const enhancedMetrics = useMemo(() => {
    if (!state.selectedLob?.mockData) return null;

    const data = state.selectedLob.mockData;
    const currentValue = data[data.length - 1]?.Value || 0;
    const previousValue = data[data.length - 2]?.Value || 0;
    const change = ((currentValue - previousValue) / previousValue) * 100;

    const totalValue = data.reduce((sum, item) => sum + item.Value, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.Orders, 0);
    const avgValue = totalValue / data.length;
    const avgOrders = totalOrders / data.length;

    // Calculate trend using linear regression
    const dataPoints: DataPoint[] = data.map(item => ({
      date: new Date(item.Date),
      value: item.Value,
      orders: item.Orders
    }));

    const trendAnalysis = statisticalAnalyzer.analyzeTrend(dataPoints);

    return {
      totalUnits: {
        value: totalValue,
        change: change,
        changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
        confidence: trendAnalysis.confidence,
        trend: (trendAnalysis.direction === 'increasing' ? 'up' : (trendAnalysis.direction === 'decreasing' ? 'down' : 'stable'))
      },
      avgUnits: {
        value: avgValue,
        change: change * 0.8, // Simplified
        changeType: change > 0 ? 'positive' : 'negative',
        confidence: trendAnalysis.confidence * 0.9,
        trend: (trendAnalysis.direction === 'increasing' ? 'up' : 'down')
      },
      totalOrders: {
        value: totalOrders,
        change: change * 0.6, // Simplified correlation
        changeType: change > 0 ? 'positive' : 'negative',
        confidence: trendAnalysis.confidence * 0.8,
        trend: (trendAnalysis.direction === 'increasing' ? 'up' : 'down')
      }
      // Removed efficiency KPI (no $/order)
    };
  }, [state.selectedLob?.mockData]);

  // Advanced analytics processing
  const performAdvancedAnalytics = async () => {
    if (!state.selectedLob?.mockData) return;

    setIsAnalyzing(true);

    try {
      const dataPoints: DataPoint[] = state.selectedLob.mockData.map(item => ({
        date: new Date(item.Date),
        value: item.Value,
        orders: item.Orders
      }));

      // Comprehensive analysis
      const statisticalSummary = statisticalAnalyzer.generateSummary(dataPoints);
      const trendAnalysis = statisticalAnalyzer.analyzeTrend(dataPoints);
      const seasonalityAnalysis = statisticalAnalyzer.analyzeSeasonality(dataPoints);
      const qualityReport = insightsGenerator.generateDataQualityReport(dataPoints);
      const businessInsights = insightsGenerator.generateForecastInsights(dataPoints, {});

      const results = {
        statistical: statisticalSummary,
        trend: trendAnalysis,
        seasonality: seasonalityAnalysis,
        quality: qualityReport,
        business: businessInsights
      };

      setAnalyticsResults(results);

      // Generate insight cards
      const cards: InsightCard[] = [];

      // Data quality insights
      if (qualityReport.score < 80) {
        cards.push({
          id: 'quality-warning',
          title: 'Data Quality Alert',
          description: `Data quality score is ${qualityReport.score}/100. ${qualityReport.issues.length} issues detected.`,
          severity: 'warning',
          actionable: true,
          recommendation: qualityReport.recommendations[0]
        });
      } else {
        cards.push({
          id: 'quality-good',
          title: 'High Data Quality',
          description: `Excellent data quality with a score of ${qualityReport.score}/100.`,
          severity: 'success',
          actionable: false
        });
      }

      // Trend insights
      if (trendAnalysis.confidence > 0.7) {
        cards.push({
          id: 'trend-insight',
          title: `${trendAnalysis.direction === 'increasing' ? 'Growth' : 'Decline'} Trend Detected`,
          description: `Strong ${trendAnalysis.direction} trend with ${(trendAnalysis.confidence * 100).toFixed(0)}% confidence.`,
          severity: trendAnalysis.direction === 'increasing' ? 'success' : 'warning',
          actionable: true,
          recommendation: trendAnalysis.direction === 'increasing' ?
            'Consider scaling operations to meet growing demand' :
            'Investigate causes and develop intervention strategies'
        });
      }

      // Seasonality insights
      if (seasonalityAnalysis.hasSeasonality) {
        cards.push({
          id: 'seasonality-insight',
          title: 'Seasonal Pattern Identified',
          description: `Strong seasonal pattern detected with ${seasonalityAnalysis.dominantPeriods[0]?.period}-period cycle.`,
          severity: 'info',
          actionable: true,
          recommendation: 'Leverage seasonal patterns for inventory and marketing planning'
        });
      }

      // Business insights
      if (businessInsights.opportunities.length > 0) {
        cards.push({
          id: 'business-opportunity',
          title: 'Business Opportunity',
          description: businessInsights.opportunities[0],
          severity: 'success',
          actionable: true,
          recommendation: businessInsights.actionableRecommendations[0]
        });
      }

      if (businessInsights.riskFactors.length > 0) {
        cards.push({
          id: 'business-risk',
          title: 'Risk Factor Identified',
          description: businessInsights.riskFactors[0],
          severity: 'warning',
          actionable: true,
          recommendation: businessInsights.actionableRecommendations[1] || 'Monitor closely and develop mitigation strategies'
        });
      }

      setInsightCards(cards);

    } catch (error) {
      console.error('Advanced analytics error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-refresh analytics
  useEffect(() => {
    if (state.selectedLob?.hasData) {
      performAdvancedAnalytics();

      // Set up auto-refresh every 30 seconds
      const interval = setInterval(performAdvancedAnalytics, 30000);
      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [state.selectedLob]);

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);

  const MetricCard = ({ title, metric, icon: Icon }: {
    title: string;
    metric: EnhancedMetrics;
    icon: React.ComponentType<any>
  }) => {
    // All KPIs are units, not currency
    const formattedValue = (() => {
      if (typeof metric.value !== 'number' || isNaN(metric.value)) return '0';
      if (metric.value > 1000) {
        return metric.value.toLocaleString();
      }
      return metric.value.toFixed(0);
    })();

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formattedValue}
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className={cn(
              "flex items-center space-x-1",
              metric.changeType === 'positive' && "text-green-600",
              metric.changeType === 'negative' && "text-red-600"
            )}>
              {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {metric.trend === 'down' && <TrendingDown className="h-3 w-3" />}
              <span>{isNaN(metric.change) ? '0.0' : (metric.change > 0 ? '+' : '') + metric.change.toFixed(1)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className="text-xs">
                {metric.confidence && !isNaN(metric.confidence) ? (metric.confidence * 100).toFixed(0) : '0'}% confidence
              </Badge>
            </div>
          </div>
          <Progress
            value={metric.confidence * 100}
            className="mt-2 h-1"
          />
        </CardContent>
      </Card>
    );
  };

  const InsightCardComponent = ({ insight }: { insight: InsightCard }) => (
    <Card className={cn(
      "border-l-4",
      insight.severity === 'error' && "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
      insight.severity === 'warning' && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
      insight.severity === 'success' && "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
      insight.severity === 'info' && "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {insight.severity === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
            {insight.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            {insight.severity === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {insight.severity === 'info' && <Eye className="h-4 w-4 text-blue-500" />}
            {insight.title}
          </CardTitle>
          {insight.actionable && (
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Actionable
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
        {insight.recommendation && (
          <div className="text-xs bg-muted/50 rounded p-2 border-l-2 border-primary">
            <strong>Recommendation:</strong> {insight.recommendation}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const vizData = useMemo(() => {
    if (!state.selectedLob) return null;

    // Use date range from AppState
    const selectedDateRange = state.dateRange || { start: null, end: null };

    // Filter mockData by selected date range if available
    if (state.selectedLob.mockData && state.selectedLob.mockData.length > 0) {
      if (selectedDateRange.start && selectedDateRange.end) {
        return state.selectedLob.mockData.filter(item => {
          const itemDate = new Date(item.Date);
          return itemDate >= selectedDateRange.start && itemDate <= selectedDateRange.end;
        });
      }
      return state.selectedLob.mockData;
    }

    // Generate fallback data for any selected LOB (with or without uploaded data)
    const recordCount = state.selectedLob.recordCount || 52; // default to 52 weeks
    const baseValue = 50 + Math.random() * 100;
    const data = [];
    const forecastWeeks = 4;

    for (let week = 1; week <= Math.min(52, Math.ceil(recordCount / 100)) + forecastWeeks; week++) {
      const seasonalMultiplier = 1 + 0.3 * Math.sin((week / 52) * 2 * Math.PI);
      const trendMultiplier = 1 + (week / 52) * 0.2;
      const randomVariation = 0.8 + Math.random() * 0.4;

      const value = Math.round(baseValue * seasonalMultiplier * trendMultiplier * randomVariation);
      const orders = Math.round(value * (0.7 + Math.random() * 0.6));

      if (week > Math.min(52, Math.ceil(recordCount / 100))) {
        data.push({
          Date: new Date(2024, 0, week * 7),
          Value: null,
          Orders: null,
          Forecast: value,
        });
      } else {
        data.push({
          Date: new Date(2024, 0, week * 7),
          Value: value,
          Orders: orders,
        });
      }
    }

    // Filter fallback data by selected date range if set
    if (selectedDateRange.start && selectedDateRange.end) {
      return data.filter(item => {
        const itemDate = new Date(item.Date);
        return itemDate >= selectedDateRange.start && itemDate <= selectedDateRange.end;
      });
    }

    return data;
  }, [state.selectedLob, state.selectedDateRange]);

  return (
    <Card className={cn("flex flex-col rounded-none border-0 md:border-r", className)}>
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Enhanced Insights Panel
            </CardTitle>
            {isAnalyzing && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyzing...
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={performAdvancedAnalytics}
              disabled={isAnalyzing || !state.selectedLob?.hasData}
            >
              <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: false })}
            >
              Hide
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <BuLobSelector />
          <div className="flex items-center gap-2">
            {/* Date Range Picker */}
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium mr-1">From</label>
              <input
                type="date"
                value={localDateRange.start.toISOString().slice(0, 10)}
                onChange={e => {
                  const newStart = new Date(e.target.value);
                  setLocalDateRange(r => ({ ...r, start: newStart }));
                  dispatch({ type: "SET_DATE_RANGE", payload: { start: newStart, end: localDateRange.end } });
                }}
                className="border rounded px-1 py-0.5 text-xs"
                max={localDateRange.end.toISOString().slice(0, 10)}
              />
              <label className="text-xs font-medium mx-1">to</label>
              <input
                type="date"
                value={localDateRange.end.toISOString().slice(0, 10)}
                onChange={e => {
                  const newEnd = new Date(e.target.value);
                  setLocalDateRange(r => ({ ...r, end: newEnd }));
                  dispatch({ type: "SET_DATE_RANGE", payload: { start: localDateRange.start, end: newEnd } });
                }}
                className="border rounded px-1 py-0.5 text-xs"
                min={localDateRange.start.toISOString().slice(0, 10)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <Button
              size="sm"
              variant={state.dataPanelTarget === "Value" ? "secondary" : "ghost"}
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: 'Value' })}
            >
              <Activity className="h-3 w-3 mr-1" />
              Value
            </Button>
            <Button
              size="sm"
              variant={state.dataPanelTarget === "Orders" ? "secondary" : "ghost"}
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: 'Orders' })}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Orders
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-0">
        <Tabs
          value={state.dataPanelMode}
          onValueChange={(v) => dispatch({ type: 'SET_DATA_PANEL_MODE', payload: v as any })}
          className="flex flex-col h-full"
          defaultValue="chart"
        >
          <div className="px-4 pt-3 border-b">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="text-xs">
                <PieChart className="h-3 w-3 mr-1" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="charts" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Data
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Enhanced Metrics Grid */}
                {enhancedMetrics && (
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      title="Total Units"
                      metric={enhancedMetrics.totalUnits}
                      icon={TrendingUp}
                    />
                    <MetricCard
                      title="Total Orders"
                      metric={enhancedMetrics.totalOrders}
                      icon={BarChart3}
                    />
                    <MetricCard
                      title="Average Units"
                      metric={enhancedMetrics.avgUnits}
                      icon={Activity}
                    />
                  </div>
                )}

                {/* Quick Analytics Summary */}
                {analyticsResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Analytics Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-medium mb-1">Statistical</div>
                          <div className="text-muted-foreground">
                            Mean: {analyticsResults.statistical.mean.toFixed(0)}
                          </div>
                          <div className="text-muted-foreground">
                            Std Dev: {analyticsResults.statistical.standardDeviation.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Trend</div>
                          <div className="text-muted-foreground">
                            Direction: {analyticsResults.trend.direction}
                          </div>
                          <div className="text-muted-foreground">
                            R²: {analyticsResults.trend.linearRegression.rSquared.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Quality</div>
                          <div className="text-muted-foreground">
                            Score: {analyticsResults.quality.score}/100
                          </div>
                          <div className="text-muted-foreground">
                            Issues: {analyticsResults.quality.issues.length}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Seasonality</div>
                          <div className="text-muted-foreground">
                            Detected: {analyticsResults.seasonality.hasSeasonality ? 'Yes' : 'No'}
                          </div>
                          <div className="text-muted-foreground">
                            Confidence: {(analyticsResults.seasonality.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        <Download className="h-3 w-3 mr-1" />
                        Export Data
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {!vizData && (
                  <div className="text-center text-sm text-muted-foreground py-10 px-4 border rounded-md bg-muted/30">
                    <Brain className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="font-medium">No Data Available</p>
                    <p>Select a Business Unit / LOB with data to see enhanced analytics.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="charts" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {vizData && vizData.length > 0 ? (
                  <EnhancedDataVisualizer
                    data={vizData}
                    target={state.dataPanelTarget as 'Value' | 'Orders'}
                    isRealData={true}
                    statisticalAnalysis={analyticsResults}
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-10 px-4 border rounded-md bg-muted/30">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="font-medium">No Charts Available</p>
                    <p>Select a Business Unit / LOB with data to see comprehensive charts and analysis.</p>
                    {state.selectedLob && (
                      <div className="mt-2 text-xs">
                        <p>Selected: {state.selectedLob.name}</p>
                        <p>Has Data: {state.selectedLob.hasData ? 'Yes' : 'No'}</p>
                        <p>Mock Data: {state.selectedLob.mockData ? `${state.selectedLob.mockData.length} points` : 'None'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {insightCards.length > 0 ? (
                  insightCards.map(insight => (
                    <InsightCardComponent key={insight.id} insight={insight} />
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-10 px-4 border rounded-md bg-muted/30">
                    <Zap className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="font-medium">No Insights Available</p>
                    <p>Upload data and run analysis to see AI-powered insights.</p>
                    {state.selectedLob?.hasData && (
                      <Button size="sm" className="mt-2" onClick={performAdvancedAnalytics}>
                        <Brain className="h-3 w-3 mr-1" />
                        Generate Insights
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="data" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {vizData ? (
                  <Table>
                    <TableCaption>
                      Weekly {state.dataPanelTarget} for {state.selectedLob?.name}
                      {analyticsResults && ` (Quality Score: ${analyticsResults.quality?.score || 'N/A'}/100)`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vizData.map((row, i) => {
                        const efficiency = row.Value / (row.Orders || 1);
                        const isOutlier = analyticsResults?.statistical?.outliers.indices.includes(i);
                        return (
                          <TableRow key={i} className={isOutlier ? "bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
                            <TableCell className="font-medium">
                              {new Date(row.Date).toLocaleDateString()}
                              {isOutlier && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Outlier
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.Value.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {row.Orders.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {efficiency.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-10 px-4 border rounded-md bg-muted/30">
                    <Filter className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p>Select a Business Unit / LOB with data to see enhanced data table.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
