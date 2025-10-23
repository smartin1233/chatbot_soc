import type { ValidationResult, ValidationError, ColumnMapping, ProcessedValueData } from './types';

export class DataValidationEngine {
  async validateFileStructure(file: File): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];
    
    // File format validation
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file_type',
        message: 'File type not supported. Please upload CSV or Excel files.',
        severity: 'critical',
        suggestedFix: 'Convert your file to CSV or Excel format'
      });
    }
    
    // File size validation (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push({
        field: 'file_size',
        message: 'File size exceeds 50MB limit.',
        severity: 'critical',
        suggestedFix: 'Split your data into smaller files or compress the data'
      });
    }
    
    // File name validation
    if (file.name.length > 100) {
      warnings.push({
        field: 'file_name',
        message: 'File name is very long. Consider shortening it.',
        severity: 'warning',
        suggestedFix: 'Rename file to be shorter and more descriptive'
      });
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
        suggestions: ['Please fix the critical issues before proceeding']
      };
    }
    
    // Parse and check data structure - return data for column mapping
    try {
      const data = await this.parseFile(file);
      
      if (!data || data.length === 0) {
        errors.push({
          field: 'data',
          message: 'No data found in file.',
          severity: 'critical',
          suggestedFix: 'Ensure your file contains data rows'
        });
        
        return { isValid: false, errors, warnings, suggestions };
      }

      const headers = Object.keys(data[0]);
      
      // For column mapping, we just need to validate basic structure
      return {
        isValid: true,
        errors: [],
        warnings,
        suggestions: [
          'File loaded successfully! Please map your columns in the next step.',
          `Found ${headers.length} columns and ${data.length} rows`
        ],
        dataPreview: data.slice(0, 10), // First 10 rows for preview
        columnMapping: {
          detected: {},
          required: ['date', 'target'],
          optional: ['regressor'],
          suggestions: {}
        }
      };
    } catch (error) {
      errors.push({
        field: 'file_parsing',
        message: 'Unable to parse file. Please check file format.',
        severity: 'critical',
        suggestedFix: 'Ensure file is not corrupted and follows standard CSV/Excel format'
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        suggestions: ['Download our template for the correct format']
      };
    }
  }
  
  validateDataColumns(data: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];
    
    if (!data || data.length === 0) {
      errors.push({
        field: 'data',
        message: 'No data found in file.',
        severity: 'critical',
        suggestedFix: 'Ensure your file contains data rows'
      });
      
      return { isValid: false, errors, warnings, suggestions };
    }
    
    const headers = Object.keys(data[0]);
    const columnMapping = this.detectColumns(headers);
    
    // Required column validation
    const requiredColumns = ['date', 'target'];
    const missingRequired = requiredColumns.filter(col => !columnMapping.detected[col]);
    
    if (missingRequired.length > 0) {
      missingRequired.forEach(col => {
        const fieldName = col === 'target' ? 'Target/Value' : col.charAt(0).toUpperCase() + col.slice(1);
        errors.push({
          field: col,
          message: `Required column '${fieldName}' not found.`,
          severity: 'critical',
          suggestedFix: `Add a column with ${fieldName} data or rename existing column`
        });
      });
    }
    
    // Data quality validation
    if (columnMapping.detected.date) {
      const dateValidation = this.validateDateColumn(data, columnMapping.detected.date);
      errors.push(...dateValidation.errors);
      warnings.push(...dateValidation.warnings);
    }
    
    if (columnMapping.detected.target) {
      const targetValidation = this.validateTargetColumn(data, columnMapping.detected.target);
      errors.push(...targetValidation.errors);
      warnings.push(...targetValidation.warnings);
    }
    
    if (columnMapping.detected.exogenous) {
      const exogenousValidation = this.validateExogenousColumn(data, columnMapping.detected.exogenous);
      warnings.push(...exogenousValidation.warnings);
    }
    
    // Generate suggestions
    if (errors.length === 0) {
      suggestions.push('Data structure looks good!');
      if (!columnMapping.detected.exogenous) {
        suggestions.push('Consider adding exogenous variables (like Orders) for better forecasting accuracy');
      }
      if (!columnMapping.detected.forecast) {
        suggestions.push('You can include existing forecast data for comparison');
      }
    } else {
      suggestions.push('Download the corrected template to fix these issues');
      suggestions.push('Check our data format guide for detailed requirements');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      dataPreview: data.slice(0, 5),
      columnMapping
    };
  }
  
  private async parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const parsed = this.parseCSV(content);
            resolve(parsed);
          } else {
            // For Excel files, we'd need a library like xlsx
            // For now, reject Excel files with helpful message
            reject(new Error('Excel parsing not implemented. Please convert to CSV.'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  private parseCSV(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  }
  
  private detectColumns(headers: string[]): ColumnMapping {
    const detected: ColumnMapping['detected'] = {};
    const suggestions: { [key: string]: string[] } = {};
    
    // Date column detection
    const datePatterns = /^(date|time|timestamp|period|day|month|year|dt)$/i;
    const dateColumn = headers.find(h => datePatterns.test(h));
    if (dateColumn) {
      detected.date = dateColumn;
    } else {
      suggestions.date = headers.filter(h => 
        h.toLowerCase().includes('date') || 
        h.toLowerCase().includes('time') ||
        h.toLowerCase().includes('period')
      );
    }
    
    // Target column detection (Value)
    const targetPatterns = /^(target|value|sales|revenue|amount|quantity|demand|cases)$/i;
    const targetColumn = headers.find(h => targetPatterns.test(h));
    if (targetColumn) {
      detected.target = targetColumn;
    } else {
      suggestions.target = headers.filter(h => 
        !detected.date || h !== detected.date
      );
    }
    
    // Exogenous column detection (Orders)
    const exogenousPatterns = /^(exogenous|external|orders|marketing|promotion|holiday|orders)$/i;
    const exogenousColumn = headers.find(h => exogenousPatterns.test(h));
    if (exogenousColumn) {
      detected.exogenous = exogenousColumn;
    } else {
      suggestions.exogenous = headers.filter(h => 
        h.toLowerCase().includes('order') ||
        h.toLowerCase().includes('external') ||
        h.toLowerCase().includes('promo')
      );
    }
    
    // Forecast column detection
    const forecastPatterns = /^(forecast|prediction|predicted|estimate)$/i;
    const forecastColumn = headers.find(h => forecastPatterns.test(h));
    if (forecastColumn) {
      detected.forecast = forecastColumn;
    }
    
    return {
      detected,
      required: ['date', 'target'],
      optional: ['exogenous', 'forecast'],
      suggestions
    };
  }
  
  private validateDateColumn(data: any[], dateColumn: string): { errors: ValidationError[], warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    let validDates = 0;
    let invalidDates = 0;
    
    for (let i = 0; i < Math.min(data.length, 100); i++) { // Check first 100 rows
      const dateValue = data[i][dateColumn];
      if (!dateValue || dateValue.toString().trim() === '') {
        errors.push({
          field: 'date',
          message: `Empty date value in row ${i + 2}`,
          severity: 'error',
          row: i + 2,
          column: dateColumn,
          suggestedFix: 'Ensure all date cells have valid dates'
        });
        continue;
      }
      
      const parsedDate = new Date(dateValue);
      if (isNaN(parsedDate.getTime())) {
        invalidDates++;
        if (invalidDates <= 3) { // Only show first 3 errors
          errors.push({
            field: 'date',
            message: `Invalid date format in row ${i + 2}: "${dateValue}"`,
            severity: 'error',
            row: i + 2,
            column: dateColumn,
            suggestedFix: 'Use format: YYYY-MM-DD or MM/DD/YYYY'
          });
        }
      } else {
        validDates++;
      }
    }
    
    if (invalidDates > 3) {
      errors.push({
        field: 'date',
        message: `Found ${invalidDates} more invalid dates`,
        severity: 'error',
        suggestedFix: 'Check all date values for correct format'
      });
    }
    
    if (validDates === 0) {
      errors.push({
        field: 'date',
        message: 'No valid dates found in date column',
        severity: 'critical',
        suggestedFix: 'Ensure date column contains valid date values'
      });
    }
    
    return { errors, warnings };
  }
  
  private validateTargetColumn(data: any[], targetColumn: string): { errors: ValidationError[], warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    let validNumbers = 0;
    let invalidNumbers = 0;
    let negativeNumbers = 0;
    
    for (let i = 0; i < Math.min(data.length, 100); i++) { // Check first 100 rows
      const targetValue = data[i][targetColumn];
      
      if (!targetValue || targetValue.toString().trim() === '') {
        errors.push({
          field: 'target',
          message: `Empty target value in row ${i + 2}`,
          severity: 'error',
          row: i + 2,
          column: targetColumn,
          suggestedFix: 'Ensure all target cells have numeric values'
        });
        continue;
      }
      
      const numericValue = parseFloat(targetValue.toString().replace(/,/g, ''));
      if (isNaN(numericValue)) {
        invalidNumbers++;
        if (invalidNumbers <= 3) { // Only show first 3 errors
          errors.push({
            field: 'target',
            message: `Invalid numeric value in row ${i + 2}: "${targetValue}"`,
            severity: 'error',
            row: i + 2,
            column: targetColumn,
            suggestedFix: 'Use numeric values only (e.g., 123.45)'
          });
        }
      } else {
        validNumbers++;
        if (numericValue < 0) {
          negativeNumbers++;
        }
      }
    }
    
    if (invalidNumbers > 3) {
      errors.push({
        field: 'target',
        message: `Found ${invalidNumbers} more invalid numeric values`,
        severity: 'error',
        suggestedFix: 'Check all target values are numeric'
      });
    }
    
    if (negativeNumbers > 0) {
      warnings.push({
        field: 'target',
        message: `Found ${negativeNumbers} negative values`,
        severity: 'warning',
        suggestedFix: 'Negative values may affect forecasting accuracy'
      });
    }
    
    if (validNumbers === 0) {
      errors.push({
        field: 'target',
        message: 'No valid numeric values found in target column',
        severity: 'critical',
        suggestedFix: 'Ensure target column contains numeric values'
      });
    }
    
    return { errors, warnings };
  }
  
  private validateExogenousColumn(data: any[], exogenousColumn: string): { warnings: ValidationError[] } {
    const warnings: ValidationError[] = [];
    
    let validNumbers = 0;
    let invalidNumbers = 0;
    
    for (let i = 0; i < Math.min(data.length, 50); i++) { // Check first 50 rows
      const exogenousValue = data[i][exogenousColumn];
      
      if (exogenousValue && exogenousValue.toString().trim() !== '') {
        const numericValue = parseFloat(exogenousValue.toString().replace(/,/g, ''));
        if (!isNaN(numericValue)) {
          validNumbers++;
        } else {
          invalidNumbers++;
        }
      }
    }
    
    if (invalidNumbers > validNumbers) {
      warnings.push({
        field: 'exogenous',
        message: 'Exogenous column contains mostly non-numeric values',
        severity: 'warning',
        suggestedFix: 'Consider using numeric values for better forecasting'
      });
    }
    
    return { warnings };
  }
  
  generateTemplate(): Blob {
    const templateData = [
      ['Date', 'Value', 'Orders', 'Forecast'],
      ['2024-01-01', '1000', '50', ''],
      ['2024-01-02', '1100', '55', ''],
      ['2024-01-03', '950', '48', ''],
      ['2024-01-04', '1200', '60', ''],
      ['2024-01-05', '1050', '52', ''],
      ['...', '...', '...', '...']
    ];
    
    const csv = templateData.map(row => row.join(',')).join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }
  
  validateMappedColumns(data: any[], mapping: { dateColumn: string; targetColumn: string; regressorColumns: string[] }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    // Validate date column
    if (mapping.dateColumn) {
      const dateValidation = this.validateDateColumn(data, mapping.dateColumn);
      errors.push(...dateValidation.errors);
      warnings.push(...dateValidation.warnings);
    }

    // Validate target column
    if (mapping.targetColumn) {
      const targetValidation = this.validateTargetColumn(data, mapping.targetColumn);
      errors.push(...targetValidation.errors);
      warnings.push(...targetValidation.warnings);
    }

    // Validate regressor columns
    mapping.regressorColumns.forEach(regressorCol => {
      const regressorValidation = this.validateExogenousColumn(data, regressorCol);
      warnings.push(...regressorValidation.warnings);
    });

    // Generate suggestions
    if (errors.length === 0) {
      suggestions.push('✅ Column mapping validated successfully!');
      suggestions.push(`📊 Ready to process ${data.length} rows of data`);
      if (mapping.regressorColumns.length > 0) {
        suggestions.push(`🎯 Using ${mapping.regressorColumns.length} regressor variable(s) for enhanced forecasting`);
      }
    } else {
      suggestions.push('Please fix the data quality issues before proceeding');
      suggestions.push('You can still proceed, but forecast accuracy may be affected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      dataPreview: data.slice(0, 5),
      columnMapping: {
        detected: {
          date: mapping.dateColumn,
          target: mapping.targetColumn,
          exogenous: mapping.regressorColumns[0] // For backward compatibility
        },
        required: ['date', 'target'],
        optional: ['regressor'],
        suggestions: {}
      }
    };
  }

  processValueColumn(data: any[], columnName: string): ProcessedValueData {
    const values: number[] = [];
    let isUnitsColumn = false;
    
    // Check if this is a "Value" column (units)
    if (columnName.toLowerCase() === 'value') {
      isUnitsColumn = true;
    }
    
    // Process each value, removing currency symbols and converting to numbers
    data.forEach(row => {
      let value = row[columnName];
      
      if (typeof value === 'string') {
        // Remove currency symbols ($, €, £, ¥, etc.) and commas
        value = value.replace(/[$€£¥,]/g, '').trim();
      }
      
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        values.push(numericValue);
      }
    });
    
    // Calculate statistics
    const statistics = {
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      total: values.reduce((sum, val) => sum + val, 0)
    };
    
    return {
      values,
      unit: isUnitsColumn ? 'units' : 'value',
      isUnitsColumn,
      statistics
    };
  }

  suggestCorrections(errors: ValidationError[]): string[] {
    const corrections = [];
    
    const hasDateErrors = errors.some(e => e.field === 'date');
    const hasTargetErrors = errors.some(e => e.field === 'target');
    const hasFileErrors = errors.some(e => e.field.includes('file'));
    
    if (hasFileErrors) {
      corrections.push('Convert your file to CSV format for best compatibility');
      corrections.push('Ensure file size is under 50MB');
    }
    
    if (hasDateErrors) {
      corrections.push('Use consistent date format: YYYY-MM-DD (e.g., 2024-01-15)');
      corrections.push('Ensure no empty cells in the date column');
    }
    
    if (hasTargetErrors) {
      corrections.push('Use numeric values only in the target/value column');
      corrections.push('Remove any text or special characters from numeric columns');
    }
    
    corrections.push('Download our template for the correct format');
    corrections.push('Check that your data has at least Date and Value columns');
    
    return corrections;
  }
}

// Export singleton instance
export const dataValidationEngine = new DataValidationEngine();