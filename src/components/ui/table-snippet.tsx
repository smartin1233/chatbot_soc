import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableSnippetProps {
  title: string;
  data: Array<Record<string, any>>;
  maxRows?: number;
  className?: string;
}

export default function TableSnippet({ title, data, maxRows = 5, className }: TableSnippetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  if (!data || data.length === 0) {
    return null;
  }

  const columns = Object.keys(data[0]);
  const displayData = isExpanded ? data : data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  return (
    <Card className={cn("border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.length} rows × {columns.length} cols
            </Badge>
            <Button size="sm" variant="ghost" className="h-6 px-2">
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border bg-background/50">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="text-xs font-medium">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index} className="text-xs">
                  {columns.map((column) => (
                    <TableCell key={column} className="py-2">
                      {formatValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {hasMore && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              Showing {displayData.length} of {data.length} rows
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show All ({data.length - maxRows} more)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}