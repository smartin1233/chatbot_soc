'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Target, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnMappingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  columns: string[];
  dataPreview: any[];
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

interface ColumnMapping {
  dateColumn: string;
  targetColumn: string;
  regressorColumns: string[];
}

export default function ColumnMappingDialog({
  isOpen,
  onOpenChange,
  fileName,
  columns,
  dataPreview,
  onConfirm,
  onCancel
}: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateColumn: '',
    targetColumn: '',
    regressorColumns: []
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-detect columns on data change
  useEffect(() => {
    if (columns.length > 0) {
      const autoMapping = autoDetectColumns(columns);
      setMapping(autoMapping);
    }
  }, [columns]);

  const autoDetectColumns = (cols: string[]): ColumnMapping => {
    const datePatterns = /^(date|time|timestamp|period|day|month|year|dt)$/i;
    const targetPatterns = /^(target|value|sales|revenue|amount|quantity|demand|cases|units)$/i;
    const regressorPatterns = /^(orders|marketing|promotion|holiday|external|exogenous|regressor)$/i;

    const dateColumn = cols.find(col => datePatterns.test(col)) || '';
    const targetColumn = cols.find(col => targetPatterns.test(col)) || '';
    const regressorColumns = cols.filter(col => 
      regressorPatterns.test(col) || 
      (col.toLowerCase().includes('order') && col !== targetColumn)
    );

    return {
      dateColumn,
      targetColumn,
      regressorColumns
    };
  };

  const validateMapping = (): string[] => {
    const validationErrors: string[] = [];

    if (!mapping.dateColumn) {
      validationErrors.push('Date column is required');
    }

    if (!mapping.targetColumn) {
      validationErrors.push('Target column is required');
    }

    if (mapping.dateColumn === mapping.targetColumn) {
      validationErrors.push('Date and Target columns cannot be the same');
    }

    if (mapping.regressorColumns.includes(mapping.dateColumn)) {
      validationErrors.push('Date column cannot be used as a regressor');
    }

    if (mapping.regressorColumns.includes(mapping.targetColumn)) {
      validationErrors.push('Target column cannot be used as a regressor');
    }

    return validationErrors;
  };

  const handleConfirm = () => {
    const validationErrors = validateMapping();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onConfirm(mapping);
  };

  const handleRegressorToggle = (column: string) => {
    setMapping(prev => ({
      ...prev,
      regressorColumns: prev.regressorColumns.includes(column)
        ? prev.regressorColumns.filter(col => col !== column)
        : [...prev.regressorColumns, column]
    }));
  };

  const getColumnIcon = (columnType: 'date' | 'target' | 'regressor') => {
    switch (columnType) {
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'target': return <Target className="h-4 w-4" />;
      case 'regressor': return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getColumnColor = (columnType: 'date' | 'target' | 'regressor') => {
    switch (columnType) {
      case 'date': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'target': return 'text-green-600 bg-green-50 border-green-200';
      case 'regressor': return 'text-purple-600 bg-purple-50 border-purple-200';
    }
  };

  const availableColumns = columns.filter(col => 
    col !== mapping.dateColumn && col !== mapping.targetColumn
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Map Data Columns - {fileName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Help me understand your data by mapping columns to their purposes. I've made some suggestions based on column names.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Column Mapping Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Column */}
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                  <Calendar className="h-4 w-4" />
                  Date Column (Required)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={mapping.dateColumn} 
                  onValueChange={(value) => setMapping(prev => ({ ...prev, dateColumn: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Column containing dates/timestamps
                </p>
              </CardContent>
            </Card>

            {/* Target Column */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <Target className="h-4 w-4" />
                  Target Column (Required)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={mapping.targetColumn} 
                  onValueChange={(value) => setMapping(prev => ({ ...prev, targetColumn: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  The value you want to forecast
                </p>
              </CardContent>
            </Card>

            {/* Regressor Columns */}
            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-600">
                  <TrendingUp className="h-4 w-4" />
                  Regressor Columns (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableColumns.map(col => (
                    <div key={col} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`regressor-${col}`}
                        checked={mapping.regressorColumns.includes(col)}
                        onChange={() => handleRegressorToggle(col)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`regressor-${col}`} className="text-sm cursor-pointer">
                        {col}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Variables that might influence the target
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Preview with Column Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map(col => {
                        let columnType: 'date' | 'target' | 'regressor' | null = null;
                        if (col === mapping.dateColumn) columnType = 'date';
                        else if (col === mapping.targetColumn) columnType = 'target';
                        else if (mapping.regressorColumns.includes(col)) columnType = 'regressor';

                        return (
                          <TableHead key={col} className="text-xs">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-medium">{col}</span>
                              {columnType && (
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs px-1 py-0", getColumnColor(columnType))}
                                >
                                  <span className="flex items-center gap-1">
                                    {getColumnIcon(columnType)}
                                    {columnType}
                                  </span>
                                </Badge>
                              )}
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataPreview.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {columns.map(col => (
                          <TableCell key={col} className="text-xs font-mono">
                            {row[col]?.toString() || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <p><strong>Summary:</strong></p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Date Column:</strong> {mapping.dateColumn || 'Not selected'}</li>
                  <li>• <strong>Target Column:</strong> {mapping.targetColumn || 'Not selected'}</li>
                  <li>• <strong>Regressor Columns:</strong> {mapping.regressorColumns.length > 0 ? mapping.regressorColumns.join(', ') : 'None selected'}</li>
                  <li>• <strong>Total Rows:</strong> {dataPreview.length}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!mapping.dateColumn || !mapping.targetColumn}>
            Confirm Mapping & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}