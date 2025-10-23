"use client";

import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import DataVisualizer from "./data-visualizer";
import { useApp } from "./app-provider";
import BuLobSelector from "./bu-lob-selector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();

  const vizData = useMemo(() => state.selectedLob?.mockData ?? null, [state.selectedLob]);
  const totalValue = useMemo(() => vizData?.reduce((sum, row) => sum + ((row as any).Value ?? 0), 0) ?? 0, [vizData]);
  const totalOrders = useMemo(() => vizData?.reduce((sum, row) => sum + ((row as any).Orders ?? 0), 0) ?? 0, [vizData]);
  const avgValue = vizData && vizData.length > 0 ? totalValue / vizData.length : 0;
  const avgOrders = vizData && vizData.length > 0 ? totalOrders / vizData.length : 0;

  useEffect(() => {
    // Ensure target reflects state
    if (!['Value','Orders'].includes(state.dataPanelTarget)) {
      dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: 'Value' });
    }
  }, [state.dataPanelTarget, dispatch]);

  return (
    <Card className={cn("flex flex-col rounded-none border-0 md:border-r", className)}>
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Insights Panel</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'SET_DATA_PANEL_OPEN', payload: false })}>
              Hide
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <BuLobSelector />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={state.dataPanelTarget === "Value" ? "secondary" : "ghost"}
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: 'Value' })}
            >
              Value
            </Button>
            <Button
              size="sm"
              variant={state.dataPanelTarget === "Orders" ? "secondary" : "ghost"}
              onClick={() => dispatch({ type: 'SET_DATA_PANEL_TARGET', payload: 'Orders' })}
            >
              Orders
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <Tabs value={state.dataPanelMode} onValueChange={(v) => dispatch({ type: 'SET_DATA_PANEL_MODE', payload: v as any })} className="flex flex-col h-full">
          <div className="px-4 pt-3">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="chart" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {vizData ? (
                  <DataVisualizer
                    data={vizData}
                    target={state.dataPanelTarget as 'Value' | 'Orders'}
                    isRealData={true} // Allow visualization of mockData for now; provenance logic remains for real backend
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-10 px-4 border rounded-md bg-muted/30">
                    Select a Business Unit / LOB with data to see charts here.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="table" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {vizData ? (
                  <Table>
                    <TableCaption>Weekly {state.dataPanelTarget} for {state.selectedLob?.name}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vizData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(row.Date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">{row.Value.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.Orders.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-10 px-4 border rounded-md bg-muted/30">
                    Select a Business Unit / LOB with data to see a table here.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="dashboard" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>{totalValue.toLocaleString()}</CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>{totalOrders.toLocaleString()}</CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Average Value</CardTitle>
                  </CardHeader>
                  <CardContent>{avgValue.toFixed(2)}</CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Average Orders</CardTitle>
                  </CardHeader>
                  <CardContent>{avgOrders.toFixed(2)}</CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
