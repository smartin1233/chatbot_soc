/** Body_upload_dataset */
export interface BodyUploadDataset {
  /**
   * File
   * @format binary
   */
  file: File;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Lob Id */
  lob_id?: number | null;
  /** Business Unit Id */
  business_unit_id?: number | null;
}

/** BusinessUnitCreate */
export interface BusinessUnitCreate {
  /**
   * Name
   * Name of the business unit
   */
  name: string;
  /**
   * Description
   * Description of the business unit
   */
  description?: string | null;
}

/** BusinessUnitResponse */
export interface BusinessUnitResponse {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** ChatMessage */
export interface ChatMessage {
  /** Role */
  role: string;
  /** Content */
  content: string;
  /** Created At */
  created_at?: string | null;
}

/** ChatRequest */
export interface ChatRequest {
  /** Message */
  message: string;
  /** Session Id */
  session_id?: string | null;
}

/** ChatSession */
export interface ChatSession {
  /** Session Id */
  session_id: string;
  /** Title */
  title: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
  /**
   * Messages
   * @default []
   */
  messages?: ChatMessage[];
}

/** ChatSessionList */
export interface ChatSessionList {
  /** Sessions */
  sessions: ChatSession[];
  /** Total */
  total: number;
}

/** ColumnStatistics */
export interface ColumnStatistics {
  /** Column Name */
  column_name: string;
  /** Data Type */
  data_type: string;
  /** Count */
  count: number;
  /** Missing Count */
  missing_count: number;
  /** Missing Percentage */
  missing_percentage: number;
  /** Unique Count */
  unique_count?: number | null;
  /** Mean */
  mean?: number | null;
  /** Median */
  median?: number | null;
  /** Std */
  std?: number | null;
  /** Min */
  min?: number | null;
  /** Max */
  max?: number | null;
  /** Q25 */
  q25?: number | null;
  /** Q75 */
  q75?: number | null;
  /** Top Values */
  top_values?: Record<string, any>[] | null;
}

/** DatasetListResponse */
export interface DatasetListResponse {
  /** Datasets */
  datasets: DatasetResponse[];
  /** Total */
  total: number;
}

/** DatasetResponse */
export interface DatasetResponse {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /** Lob Id */
  lob_id: number | null;
  /** Business Unit Id */
  business_unit_id: number | null;
  /** Filename */
  filename: string;
  /** Row Count */
  row_count: number;
  /** Column Count */
  column_count: number;
  /** Columns Info */
  columns_info: Record<string, any>;
  /**
   * Uploaded At
   * @format date-time
   */
  uploaded_at: string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** LOBCreate */
export interface LOBCreate {
  /**
   * Business Unit Id
   * ID of the parent business unit
   */
  business_unit_id: number;
  /**
   * Name
   * Name of the LOB (e.g., Phone, Chat)
   */
  name: string;
  /**
   * Description
   * Description of the LOB
   */
  description?: string | null;
}

/** LOBResponse */
export interface LOBResponse {
  /** Id */
  id: number;
  /** Business Unit Id */
  business_unit_id: number;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** SettingsUpdate */
export interface SettingsUpdate {
  /** Openai Api Key */
  openai_api_key?: string | null;
  /** Selected Model */
  selected_model?: string | null;
}

/** StatisticalProfileResponse */
export interface StatisticalProfileResponse {
  /** Dataset Id */
  dataset_id: number;
  /** Dataset Name */
  dataset_name: string;
  /** Total Rows */
  total_rows: number;
  /** Total Columns */
  total_columns: number;
  /** Columns */
  columns: ColumnStatistics[];
  /** Overall Missing Percentage */
  overall_missing_percentage: number;
  /** Numeric Columns Count */
  numeric_columns_count: number;
  /** Categorical Columns Count */
  categorical_columns_count: number;
  /** Datetime Columns Count */
  datetime_columns_count: number;
}

/** UserSettings */
export interface UserSettings {
  /** Session Id */
  session_id: string;
  /** Openai Api Key */
  openai_api_key?: string | null;
  /**
   * Selected Model
   * @default "gpt-4o-mini"
   */
  selected_model?: string;
}

/** ValidateKeyRequest */
export interface ValidateKeyRequest {
  /** Api Key */
  api_key: string;
}

/** ValidateKeyResponse */
export interface ValidateKeyResponse {
  /** Valid */
  valid: boolean;
  /** Message */
  message: string;
  /**
   * Available Models
   * @default []
   */
  available_models?: string[];
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** WeeklyMetricBulkCreate */
export interface WeeklyMetricBulkCreate {
  /** Metrics */
  metrics: WeeklyMetricCreate[];
}

/** WeeklyMetricCreate */
export interface WeeklyMetricCreate {
  /**
   * Lob Id
   * ID of the LOB
   */
  lob_id: number;
  /**
   * Week Date
   * Sunday date for the week
   * @format date
   */
  week_date: string;
  /**
   * Metric Name
   * Name of the metric (e.g., orders, resolution_time)
   */
  metric_name: string;
  /**
   * Metric Value
   * Value of the metric
   */
  metric_value: number;
}

/** WeeklyMetricResponse */
export interface WeeklyMetricResponse {
  /** Id */
  id: number;
  /** Lob Id */
  lob_id: number;
  /**
   * Week Date
   * @format date
   */
  week_date: string;
  /** Metric Name */
  metric_name: string;
  /** Metric Value */
  metric_value: number;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

export type CheckHealthData = HealthResponse;

/** Response List Business Units */
export type ListBusinessUnitsData = BusinessUnitResponse[];

export type CreateBusinessUnitData = BusinessUnitResponse;

export type CreateBusinessUnitError = HTTPValidationError;

export interface GetBusinessUnitParams {
  /** Unit Id */
  unitId: number;
}

export type GetBusinessUnitData = BusinessUnitResponse;

export type GetBusinessUnitError = HTTPValidationError;

export interface DeleteBusinessUnitParams {
  /** Unit Id */
  unitId: number;
}

export type DeleteBusinessUnitData = any;

export type DeleteBusinessUnitError = HTTPValidationError;

export type CreateLobData = LOBResponse;

export type CreateLobError = HTTPValidationError;

export interface ListLobsParams {
  /** Business Unit Id */
  business_unit_id?: number | null;
}

/** Response List Lobs */
export type ListLobsData = LOBResponse[];

export type ListLobsError = HTTPValidationError;

export interface GetLobParams {
  /** Lob Id */
  lobId: number;
}

export type GetLobData = LOBResponse;

export type GetLobError = HTTPValidationError;

export interface DeleteLobParams {
  /** Lob Id */
  lobId: number;
}

export type DeleteLobData = any;

export type DeleteLobError = HTTPValidationError;

export type CreateWeeklyMetricData = WeeklyMetricResponse;

export type CreateWeeklyMetricError = HTTPValidationError;

export interface ListWeeklyMetricsParams {
  /** Lob Id */
  lob_id?: number | null;
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
  /** Metric Name */
  metric_name?: string | null;
}

/** Response List Weekly Metrics */
export type ListWeeklyMetricsData = WeeklyMetricResponse[];

export type ListWeeklyMetricsError = HTTPValidationError;

export type CreateWeeklyMetricsBulkData = any;

export type CreateWeeklyMetricsBulkError = HTTPValidationError;

export interface GetWeeklyMetricParams {
  /** Metric Id */
  metricId: number;
}

export type GetWeeklyMetricData = WeeklyMetricResponse;

export type GetWeeklyMetricError = HTTPValidationError;

export interface DeleteWeeklyMetricParams {
  /** Metric Id */
  metricId: number;
}

export type DeleteWeeklyMetricData = any;

export type DeleteWeeklyMetricError = HTTPValidationError;

export interface GenerateDummyDataParams {
  /**
   * Weeks
   * @default 12
   */
  weeks?: number;
}

export type GenerateDummyDataData = any;

export type GenerateDummyDataError = HTTPValidationError;

export type UploadDatasetData = DatasetResponse;

export type UploadDatasetError = HTTPValidationError;

export interface ListDatasetsParams {
  /** Lob Id */
  lob_id?: number | null;
  /** Business Unit Id */
  business_unit_id?: number | null;
}

export type ListDatasetsData = DatasetListResponse;

export type ListDatasetsError = HTTPValidationError;

export interface GetDatasetParams {
  /** Dataset Id */
  datasetId: number;
}

export type GetDatasetData = DatasetResponse;

export type GetDatasetError = HTTPValidationError;

export interface DeleteDatasetParams {
  /** Dataset Id */
  datasetId: number;
}

export type DeleteDatasetData = any;

export type DeleteDatasetError = HTTPValidationError;

export interface AnalyzeDatasetParams {
  /** Dataset Id */
  datasetId: number;
}

export type AnalyzeDatasetData = StatisticalProfileResponse;

export type AnalyzeDatasetError = HTTPValidationError;

export type ChatMessageData = any;

export type ChatMessageError = HTTPValidationError;

export type ListSessionsData = ChatSessionList;

export interface GetSessionParams {
  /** Session Id */
  sessionId: string;
}

export type GetSessionData = ChatSession;

export type GetSessionError = HTTPValidationError;

export interface DeleteSessionParams {
  /** Session Id */
  sessionId: string;
}

export type DeleteSessionData = any;

export type DeleteSessionError = HTTPValidationError;

export type ValidateApiKeyData = ValidateKeyResponse;

export type ValidateApiKeyError = HTTPValidationError;

export interface GetSettingsParams {
  /** Session Id */
  sessionId: string;
}

export type GetSettingsData = UserSettings;

export type GetSettingsError = HTTPValidationError;

export interface UpdateSettingsParams {
  /** Session Id */
  sessionId: string;
}

export type UpdateSettingsData = UserSettings;

export type UpdateSettingsError = HTTPValidationError;
