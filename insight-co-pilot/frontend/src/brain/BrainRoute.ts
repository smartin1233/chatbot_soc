import {
  AnalyzeDatasetData,
  BodyUploadDataset,
  BusinessUnitCreate,
  ChatMessageData,
  ChatRequest,
  CheckHealthData,
  CreateBusinessUnitData,
  CreateLobData,
  CreateWeeklyMetricData,
  CreateWeeklyMetricsBulkData,
  DeleteBusinessUnitData,
  DeleteDatasetData,
  DeleteLobData,
  DeleteSessionData,
  DeleteWeeklyMetricData,
  GenerateDummyDataData,
  GetBusinessUnitData,
  GetDatasetData,
  GetLobData,
  GetSessionData,
  GetSettingsData,
  GetWeeklyMetricData,
  LOBCreate,
  ListBusinessUnitsData,
  ListDatasetsData,
  ListLobsData,
  ListSessionsData,
  ListWeeklyMetricsData,
  SettingsUpdate,
  UpdateSettingsData,
  UploadDatasetData,
  ValidateApiKeyData,
  ValidateKeyRequest,
  WeeklyMetricBulkCreate,
  WeeklyMetricCreate,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description List all business units.
   * @tags dbtn/module:business_data
   * @name list_business_units
   * @summary List Business Units
   * @request GET:/routes/business-data/business-units
   */
  export namespace list_business_units {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListBusinessUnitsData;
  }

  /**
   * @description Create a new business unit.
   * @tags dbtn/module:business_data
   * @name create_business_unit
   * @summary Create Business Unit
   * @request POST:/routes/business-data/business-units
   */
  export namespace create_business_unit {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BusinessUnitCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateBusinessUnitData;
  }

  /**
   * @description Get a specific business unit by ID.
   * @tags dbtn/module:business_data
   * @name get_business_unit
   * @summary Get Business Unit
   * @request GET:/routes/business-data/business-units/{unit_id}
   */
  export namespace get_business_unit {
    export type RequestParams = {
      /** Unit Id */
      unitId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBusinessUnitData;
  }

  /**
   * @description Delete a business unit.
   * @tags dbtn/module:business_data
   * @name delete_business_unit
   * @summary Delete Business Unit
   * @request DELETE:/routes/business-data/business-units/{unit_id}
   */
  export namespace delete_business_unit {
    export type RequestParams = {
      /** Unit Id */
      unitId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteBusinessUnitData;
  }

  /**
   * @description Create a new Line of Business (LOB).
   * @tags dbtn/module:business_data
   * @name create_lob
   * @summary Create Lob
   * @request POST:/routes/business-data/lobs
   */
  export namespace create_lob {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LOBCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateLobData;
  }

  /**
   * @description List all LOBs, optionally filtered by business unit.
   * @tags dbtn/module:business_data
   * @name list_lobs
   * @summary List Lobs
   * @request GET:/routes/business-data/lobs
   */
  export namespace list_lobs {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Business Unit Id */
      business_unit_id?: number | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListLobsData;
  }

  /**
   * @description Get a specific LOB by ID.
   * @tags dbtn/module:business_data
   * @name get_lob
   * @summary Get Lob
   * @request GET:/routes/business-data/lobs/{lob_id}
   */
  export namespace get_lob {
    export type RequestParams = {
      /** Lob Id */
      lobId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLobData;
  }

  /**
   * @description Delete a LOB.
   * @tags dbtn/module:business_data
   * @name delete_lob
   * @summary Delete Lob
   * @request DELETE:/routes/business-data/lobs/{lob_id}
   */
  export namespace delete_lob {
    export type RequestParams = {
      /** Lob Id */
      lobId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteLobData;
  }

  /**
   * @description Create a single weekly metric.
   * @tags dbtn/module:business_data
   * @name create_weekly_metric
   * @summary Create Weekly Metric
   * @request POST:/routes/business-data/weekly-metrics
   */
  export namespace create_weekly_metric {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WeeklyMetricCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateWeeklyMetricData;
  }

  /**
   * @description List weekly metrics with optional filters.
   * @tags dbtn/module:business_data
   * @name list_weekly_metrics
   * @summary List Weekly Metrics
   * @request GET:/routes/business-data/weekly-metrics
   */
  export namespace list_weekly_metrics {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Lob Id */
      lob_id?: number | null;
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
      /** Metric Name */
      metric_name?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListWeeklyMetricsData;
  }

  /**
   * @description Create multiple weekly metrics in bulk.
   * @tags dbtn/module:business_data
   * @name create_weekly_metrics_bulk
   * @summary Create Weekly Metrics Bulk
   * @request POST:/routes/business-data/weekly-metrics/bulk
   */
  export namespace create_weekly_metrics_bulk {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WeeklyMetricBulkCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateWeeklyMetricsBulkData;
  }

  /**
   * @description Get a specific weekly metric by ID.
   * @tags dbtn/module:business_data
   * @name get_weekly_metric
   * @summary Get Weekly Metric
   * @request GET:/routes/business-data/weekly-metrics/{metric_id}
   */
  export namespace get_weekly_metric {
    export type RequestParams = {
      /** Metric Id */
      metricId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetWeeklyMetricData;
  }

  /**
   * @description Delete a weekly metric.
   * @tags dbtn/module:business_data
   * @name delete_weekly_metric
   * @summary Delete Weekly Metric
   * @request DELETE:/routes/business-data/weekly-metrics/{metric_id}
   */
  export namespace delete_weekly_metric {
    export type RequestParams = {
      /** Metric Id */
      metricId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteWeeklyMetricData;
  }

  /**
   * @description Generate dummy weekly metrics for Phone and Chat LOBs.
   * @tags dbtn/module:business_data
   * @name generate_dummy_data
   * @summary Generate Dummy Data
   * @request POST:/routes/business-data/generate-dummy-data
   */
  export namespace generate_dummy_data {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Weeks
       * @default 12
       */
      weeks?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateDummyDataData;
  }

  /**
   * @description Upload a CSV dataset and store it in the database.
   * @tags dbtn/module:data_upload
   * @name upload_dataset
   * @summary Upload Dataset
   * @request POST:/routes/data/upload
   */
  export namespace upload_dataset {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadDataset;
    export type RequestHeaders = {};
    export type ResponseBody = UploadDatasetData;
  }

  /**
   * @description List all uploaded datasets.
   * @tags dbtn/module:data_upload
   * @name list_datasets
   * @summary List Datasets
   * @request GET:/routes/data/datasets
   */
  export namespace list_datasets {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Lob Id */
      lob_id?: number | null;
      /** Business Unit Id */
      business_unit_id?: number | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListDatasetsData;
  }

  /**
   * @description Get dataset metadata.
   * @tags dbtn/module:data_upload
   * @name get_dataset
   * @summary Get Dataset
   * @request GET:/routes/data/datasets/{dataset_id}
   */
  export namespace get_dataset {
    export type RequestParams = {
      /** Dataset Id */
      datasetId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDatasetData;
  }

  /**
   * @description Delete a dataset and all its data.
   * @tags dbtn/module:data_upload
   * @name delete_dataset
   * @summary Delete Dataset
   * @request DELETE:/routes/data/datasets/{dataset_id}
   */
  export namespace delete_dataset {
    export type RequestParams = {
      /** Dataset Id */
      datasetId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteDatasetData;
  }

  /**
   * @description Perform statistical profiling on a dataset (DataExplorer agent functionality).
   * @tags dbtn/module:data_upload
   * @name analyze_dataset
   * @summary Analyze Dataset
   * @request GET:/routes/data/datasets/{dataset_id}/analyze
   */
  export namespace analyze_dataset {
    export type RequestParams = {
      /** Dataset Id */
      datasetId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeDatasetData;
  }

  /**
   * @description Send a message and get streaming response with agent orchestration.
   * @tags stream, dbtn/module:chat
   * @name chat_message
   * @summary Chat Message
   * @request POST:/routes/chat/message
   */
  export namespace chat_message {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ChatMessageData;
  }

  /**
   * @description List all chat sessions.
   * @tags dbtn/module:chat
   * @name list_sessions
   * @summary List Sessions
   * @request GET:/routes/chat/sessions
   */
  export namespace list_sessions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListSessionsData;
  }

  /**
   * @description Get a specific chat session with messages.
   * @tags dbtn/module:chat
   * @name get_session
   * @summary Get Session
   * @request GET:/routes/chat/sessions/{session_id}
   */
  export namespace get_session {
    export type RequestParams = {
      /** Session Id */
      sessionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSessionData;
  }

  /**
   * @description Delete a chat session.
   * @tags dbtn/module:chat
   * @name delete_session
   * @summary Delete Session
   * @request DELETE:/routes/chat/sessions/{session_id}
   */
  export namespace delete_session {
    export type RequestParams = {
      /** Session Id */
      sessionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteSessionData;
  }

  /**
   * @description Validate OpenAI API key and return available models.
   * @tags dbtn/module:settings
   * @name validate_api_key
   * @summary Validate Api Key
   * @request POST:/routes/settings/validate-key
   */
  export namespace validate_api_key {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidateKeyRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateApiKeyData;
  }

  /**
   * @description Get user settings for a session.
   * @tags dbtn/module:settings
   * @name get_settings
   * @summary Get Settings
   * @request GET:/routes/settings/settings/{session_id}
   */
  export namespace get_settings {
    export type RequestParams = {
      /** Session Id */
      sessionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSettingsData;
  }

  /**
   * @description Update user settings.
   * @tags dbtn/module:settings
   * @name update_settings
   * @summary Update Settings
   * @request POST:/routes/settings/settings/{session_id}
   */
  export namespace update_settings {
    export type RequestParams = {
      /** Session Id */
      sessionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SettingsUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateSettingsData;
  }
}
