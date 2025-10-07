/**
 * Hook for CRUD operations on data_feeds
 */

import { useState } from 'react';
import { getAPIClient } from '@/lib/api-client';
import { useApp } from '@/components/dashboard/app-provider';

export function useDataCRUD() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useApp();

  /**
   * Create a new data record
   */
  const createRecord = async (data: {
    business_unit_id: number;
    lob_id: number;
    date: string;
    value: number;
    parameter_id?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiClient = getAPIClient();
      const recordId = await apiClient.createDataFeed(data);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✅ **Record Created Successfully!**\n\nRecord ID: ${recordId}\nDate: ${data.date}\nValue: ${data.value}`,
          suggestions: ['Create another record', 'View all records', 'Run analysis'],
        },
      });

      return recordId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **Failed to create record**\n\nError: ${errorMsg}`,
          suggestions: ['Try again', 'Check your data', 'Contact support'],
        },
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing record
   */
  const updateRecord = async (recordId: number, values: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiClient = getAPIClient();
      await apiClient.updateDataFeed(recordId, values);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✅ **Record Updated Successfully!**\n\nRecord ID: ${recordId}\nUpdated fields: ${Object.keys(values).join(', ')}`,
          suggestions: ['Update another record', 'View record', 'Undo changes'],
        },
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **Failed to update record**\n\nError: ${errorMsg}`,
          suggestions: ['Try again', 'Check record ID', 'Contact support'],
        },
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a record
   */
  const deleteRecord = async (recordId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiClient = getAPIClient();
      await apiClient.deleteDataFeed(recordId);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✅ **Record Deleted Successfully!**\n\nRecord ID: ${recordId} has been removed from the system.`,
          suggestions: ['View remaining records', 'Undo deletion', 'Create new record'],
        },
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **Failed to delete record**\n\nError: ${errorMsg}`,
          suggestions: ['Try again', 'Check record ID', 'Contact support'],
        },
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch data for a specific LOB
   */
  const fetchLOBData = async (lobId: string, limit: number = 1000) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiClient = getAPIClient();
      const data = await apiClient.getDataForLOB(lobId, limit);

      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bulk upload data records
   */
  const bulkUpload = async (
    records: Array<{
      business_unit_id: number;
      lob_id: number;
      date: string;
      value: number;
      parameter_id?: number;
    }>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiClient = getAPIClient();
      const results = await Promise.all(
        records.map(record => apiClient.createDataFeed(record))
      );

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✅ **Bulk Upload Successful!**\n\n${results.length} records created successfully.`,
          suggestions: ['View uploaded data', 'Run analysis', 'Upload more data'],
        },
      });

      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **Bulk Upload Failed**\n\nError: ${errorMsg}\n\nSome records may have been created before the error occurred.`,
          suggestions: ['Check uploaded records', 'Try again', 'Contact support'],
        },
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createRecord,
    updateRecord,
    deleteRecord,
    fetchLOBData,
    bulkUpload,
    isLoading,
    error,
  };
}
