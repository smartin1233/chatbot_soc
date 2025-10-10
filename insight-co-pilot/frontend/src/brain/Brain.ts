import {
  AnalyzeDatasetData,
  AnalyzeDatasetError,
  AnalyzeDatasetParams,
  BodyUploadDataset,
  BusinessUnitCreate,
  ChatMessageData,
  ChatMessageError,
  ChatRequest,
  CheckHealthData,
  CreateBusinessUnitData,
  CreateBusinessUnitError,
  CreateLobData,
  CreateLobError,
  CreateWeeklyMetricData,
  CreateWeeklyMetricError,
  CreateWeeklyMetricsBulkData,
  CreateWeeklyMetricsBulkError,
  DeleteBusinessUnitData,
  DeleteBusinessUnitError,
  DeleteBusinessUnitParams,
  DeleteDatasetData,
  DeleteDatasetError,
  DeleteDatasetParams,
  DeleteLobData,
  DeleteLobError,
  DeleteLobParams,
  DeleteSessionData,
  DeleteSessionError,
  DeleteSessionParams,
  DeleteWeeklyMetricData,
  DeleteWeeklyMetricError,
  DeleteWeeklyMetricParams,
  GenerateDummyDataData,
  GenerateDummyDataError,
  GenerateDummyDataParams,
  GetBusinessUnitData,
  GetBusinessUnitError,
  GetBusinessUnitParams,
  GetDatasetData,
  GetDatasetError,
  GetDatasetParams,
  GetLobData,
  GetLobError,
  GetLobParams,
  GetSessionData,
  GetSessionError,
  GetSessionParams,
  GetSettingsData,
  GetSettingsError,
  GetSettingsParams,
  GetWeeklyMetricData,
  GetWeeklyMetricError,
  GetWeeklyMetricParams,
  LOBCreate,
  ListBusinessUnitsData,
  ListDatasetsData,
  ListDatasetsError,
  ListDatasetsParams,
  ListLobsData,
  ListLobsError,
  ListLobsParams,
  ListSessionsData,
  ListWeeklyMetricsData,
  ListWeeklyMetricsError,
  ListWeeklyMetricsParams,
  SettingsUpdate,
  UpdateSettingsData,
  UpdateSettingsError,
  UpdateSettingsParams,
  UploadDatasetData,
  UploadDatasetError,
  ValidateApiKeyData,
  ValidateApiKeyError,
  ValidateKeyRequest,
  WeeklyMetricBulkCreate,
  WeeklyMetricCreate,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all business units.
   *
   * @tags dbtn/module:business_data
   * @name list_business_units
   * @summary List Business Units
   * @request GET:/routes/business-data/business-units
   */
  list_business_units = (params: RequestParams = {}) =>
    this.request<ListBusinessUnitsData, any>({
      path: `/routes/business-data/business-units`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new business unit.
   *
   * @tags dbtn/module:business_data
   * @name create_business_unit
   * @summary Create Business Unit
   * @request POST:/routes/business-data/business-units
   */
  create_business_unit = (data: BusinessUnitCreate, params: RequestParams = {}) =>
    this.request<CreateBusinessUnitData, CreateBusinessUnitError>({
      path: `/routes/business-data/business-units`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a specific business unit by ID.
   *
   * @tags dbtn/module:business_data
   * @name get_business_unit
   * @summary Get Business Unit
   * @request GET:/routes/business-data/business-units/{unit_id}
   */
  get_business_unit = ({ unitId, ...query }: GetBusinessUnitParams, params: RequestParams = {}) =>
    this.request<GetBusinessUnitData, GetBusinessUnitError>({
      path: `/routes/business-data/business-units/${unitId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a business unit.
   *
   * @tags dbtn/module:business_data
   * @name delete_business_unit
   * @summary Delete Business Unit
   * @request DELETE:/routes/business-data/business-units/{unit_id}
   */
  delete_business_unit = ({ unitId, ...query }: DeleteBusinessUnitParams, params: RequestParams = {}) =>
    this.request<DeleteBusinessUnitData, DeleteBusinessUnitError>({
      path: `/routes/business-data/business-units/${unitId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Create a new Line of Business (LOB).
   *
   * @tags dbtn/module:business_data
   * @name create_lob
   * @summary Create Lob
   * @request POST:/routes/business-data/lobs
   */
  create_lob = (data: LOBCreate, params: RequestParams = {}) =>
    this.request<CreateLobData, CreateLobError>({
      path: `/routes/business-data/lobs`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all LOBs, optionally filtered by business unit.
   *
   * @tags dbtn/module:business_data
   * @name list_lobs
   * @summary List Lobs
   * @request GET:/routes/business-data/lobs
   */
  list_lobs = (query: ListLobsParams, params: RequestParams = {}) =>
    this.request<ListLobsData, ListLobsError>({
      path: `/routes/business-data/lobs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific LOB by ID.
   *
   * @tags dbtn/module:business_data
   * @name get_lob
   * @summary Get Lob
   * @request GET:/routes/business-data/lobs/{lob_id}
   */
  get_lob = ({ lobId, ...query }: GetLobParams, params: RequestParams = {}) =>
    this.request<GetLobData, GetLobError>({
      path: `/routes/business-data/lobs/${lobId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a LOB.
   *
   * @tags dbtn/module:business_data
   * @name delete_lob
   * @summary Delete Lob
   * @request DELETE:/routes/business-data/lobs/{lob_id}
   */
  delete_lob = ({ lobId, ...query }: DeleteLobParams, params: RequestParams = {}) =>
    this.request<DeleteLobData, DeleteLobError>({
      path: `/routes/business-data/lobs/${lobId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Create a single weekly metric.
   *
   * @tags dbtn/module:business_data
   * @name create_weekly_metric
   * @summary Create Weekly Metric
   * @request POST:/routes/business-data/weekly-metrics
   */
  create_weekly_metric = (data: WeeklyMetricCreate, params: RequestParams = {}) =>
    this.request<CreateWeeklyMetricData, CreateWeeklyMetricError>({
      path: `/routes/business-data/weekly-metrics`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List weekly metrics with optional filters.
   *
   * @tags dbtn/module:business_data
   * @name list_weekly_metrics
   * @summary List Weekly Metrics
   * @request GET:/routes/business-data/weekly-metrics
   */
  list_weekly_metrics = (query: ListWeeklyMetricsParams, params: RequestParams = {}) =>
    this.request<ListWeeklyMetricsData, ListWeeklyMetricsError>({
      path: `/routes/business-data/weekly-metrics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create multiple weekly metrics in bulk.
   *
   * @tags dbtn/module:business_data
   * @name create_weekly_metrics_bulk
   * @summary Create Weekly Metrics Bulk
   * @request POST:/routes/business-data/weekly-metrics/bulk
   */
  create_weekly_metrics_bulk = (data: WeeklyMetricBulkCreate, params: RequestParams = {}) =>
    this.request<CreateWeeklyMetricsBulkData, CreateWeeklyMetricsBulkError>({
      path: `/routes/business-data/weekly-metrics/bulk`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a specific weekly metric by ID.
   *
   * @tags dbtn/module:business_data
   * @name get_weekly_metric
   * @summary Get Weekly Metric
   * @request GET:/routes/business-data/weekly-metrics/{metric_id}
   */
  get_weekly_metric = ({ metricId, ...query }: GetWeeklyMetricParams, params: RequestParams = {}) =>
    this.request<GetWeeklyMetricData, GetWeeklyMetricError>({
      path: `/routes/business-data/weekly-metrics/${metricId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a weekly metric.
   *
   * @tags dbtn/module:business_data
   * @name delete_weekly_metric
   * @summary Delete Weekly Metric
   * @request DELETE:/routes/business-data/weekly-metrics/{metric_id}
   */
  delete_weekly_metric = ({ metricId, ...query }: DeleteWeeklyMetricParams, params: RequestParams = {}) =>
    this.request<DeleteWeeklyMetricData, DeleteWeeklyMetricError>({
      path: `/routes/business-data/weekly-metrics/${metricId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Generate dummy weekly metrics for Phone and Chat LOBs.
   *
   * @tags dbtn/module:business_data
   * @name generate_dummy_data
   * @summary Generate Dummy Data
   * @request POST:/routes/business-data/generate-dummy-data
   */
  generate_dummy_data = (query: GenerateDummyDataParams, params: RequestParams = {}) =>
    this.request<GenerateDummyDataData, GenerateDummyDataError>({
      path: `/routes/business-data/generate-dummy-data`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Upload a CSV dataset and store it in the database.
   *
   * @tags dbtn/module:data_upload
   * @name upload_dataset
   * @summary Upload Dataset
   * @request POST:/routes/data/upload
   */
  upload_dataset = (data: BodyUploadDataset, params: RequestParams = {}) =>
    this.request<UploadDatasetData, UploadDatasetError>({
      path: `/routes/data/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description List all uploaded datasets.
   *
   * @tags dbtn/module:data_upload
   * @name list_datasets
   * @summary List Datasets
   * @request GET:/routes/data/datasets
   */
  list_datasets = (query: ListDatasetsParams, params: RequestParams = {}) =>
    this.request<ListDatasetsData, ListDatasetsError>({
      path: `/routes/data/datasets`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get dataset metadata.
   *
   * @tags dbtn/module:data_upload
   * @name get_dataset
   * @summary Get Dataset
   * @request GET:/routes/data/datasets/{dataset_id}
   */
  get_dataset = ({ datasetId, ...query }: GetDatasetParams, params: RequestParams = {}) =>
    this.request<GetDatasetData, GetDatasetError>({
      path: `/routes/data/datasets/${datasetId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a dataset and all its data.
   *
   * @tags dbtn/module:data_upload
   * @name delete_dataset
   * @summary Delete Dataset
   * @request DELETE:/routes/data/datasets/{dataset_id}
   */
  delete_dataset = ({ datasetId, ...query }: DeleteDatasetParams, params: RequestParams = {}) =>
    this.request<DeleteDatasetData, DeleteDatasetError>({
      path: `/routes/data/datasets/${datasetId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Perform statistical profiling on a dataset (DataExplorer agent functionality).
   *
   * @tags dbtn/module:data_upload
   * @name analyze_dataset
   * @summary Analyze Dataset
   * @request GET:/routes/data/datasets/{dataset_id}/analyze
   */
  analyze_dataset = ({ datasetId, ...query }: AnalyzeDatasetParams, params: RequestParams = {}) =>
    this.request<AnalyzeDatasetData, AnalyzeDatasetError>({
      path: `/routes/data/datasets/${datasetId}/analyze`,
      method: "GET",
      ...params,
    });

  /**
   * @description Send a message and get streaming response with agent orchestration.
   *
   * @tags stream, dbtn/module:chat
   * @name chat_message
   * @summary Chat Message
   * @request POST:/routes/chat/message
   */
  chat_message = (data: ChatRequest, params: RequestParams = {}) =>
    this.requestStream<ChatMessageData, ChatMessageError>({
      path: `/routes/chat/message`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all chat sessions.
   *
   * @tags dbtn/module:chat
   * @name list_sessions
   * @summary List Sessions
   * @request GET:/routes/chat/sessions
   */
  list_sessions = (params: RequestParams = {}) =>
    this.request<ListSessionsData, any>({
      path: `/routes/chat/sessions`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a specific chat session with messages.
   *
   * @tags dbtn/module:chat
   * @name get_session
   * @summary Get Session
   * @request GET:/routes/chat/sessions/{session_id}
   */
  get_session = ({ sessionId, ...query }: GetSessionParams, params: RequestParams = {}) =>
    this.request<GetSessionData, GetSessionError>({
      path: `/routes/chat/sessions/${sessionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a chat session.
   *
   * @tags dbtn/module:chat
   * @name delete_session
   * @summary Delete Session
   * @request DELETE:/routes/chat/sessions/{session_id}
   */
  delete_session = ({ sessionId, ...query }: DeleteSessionParams, params: RequestParams = {}) =>
    this.request<DeleteSessionData, DeleteSessionError>({
      path: `/routes/chat/sessions/${sessionId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Validate OpenAI API key and return available models.
   *
   * @tags dbtn/module:settings
   * @name validate_api_key
   * @summary Validate Api Key
   * @request POST:/routes/settings/validate-key
   */
  validate_api_key = (data: ValidateKeyRequest, params: RequestParams = {}) =>
    this.request<ValidateApiKeyData, ValidateApiKeyError>({
      path: `/routes/settings/validate-key`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get user settings for a session.
   *
   * @tags dbtn/module:settings
   * @name get_settings
   * @summary Get Settings
   * @request GET:/routes/settings/settings/{session_id}
   */
  get_settings = ({ sessionId, ...query }: GetSettingsParams, params: RequestParams = {}) =>
    this.request<GetSettingsData, GetSettingsError>({
      path: `/routes/settings/settings/${sessionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update user settings.
   *
   * @tags dbtn/module:settings
   * @name update_settings
   * @summary Update Settings
   * @request POST:/routes/settings/settings/{session_id}
   */
  update_settings = ({ sessionId, ...query }: UpdateSettingsParams, data: SettingsUpdate, params: RequestParams = {}) =>
    this.request<UpdateSettingsData, UpdateSettingsError>({
      path: `/routes/settings/settings/${sessionId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
