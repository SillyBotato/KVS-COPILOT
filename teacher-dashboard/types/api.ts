export interface ParsedExcelResponse {
  columns: string[];
  rows: ParsedRow[];
  source_file: string;
  source_date: string | null;
}

export interface ParsedRow {
  class: string;
  class_raw: string;
  [key: string]: string | number;
}

export interface RecordFields {
  numberOfSections: number;
  authorisedCapacity: number | null;
  totalEnrolledStudents: number;
  boys: number;
  girls: number;
  scheduledCaste: number;
  scheduledTribes: number;
  otherBackwardClasses: number;
  ph: number;
  general: number;
  generalMinorities: number;
  lastUpdated: string | null;
}

export interface ApprovedRecord {
  id: string;
  displayName: string;
  sourceClass: string;
  section: string | null;
  finalDisplayGroup: string;
  approved: boolean;
  fields: RecordFields;
}

export interface ComputeResponse {
  status: string;
  record: ApprovedRecord;
  needs_review: string[];
  warnings: ValidationWarning[];
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: "warning" | "error";
}

export interface ApprovedRecordsResponse {
  sessionId: string;
  records: ApprovedRecord[];
}

export interface AllRecordsResponse {
  sessionId: string;
  recordCount: number;
  records: ApprovedRecord[];
}

export interface ApproveResponse {
  status: string;
  recordId: string;
  approved: boolean;
}

export interface UploadResponse {
  status: string;
  upload: ParsedExcelResponse;
  prepared: {
    sessionId: string;
    status: string;
    recordCount: number;
    records: ApprovedRecord[];
  };
}

export interface FieldsResponse {
  available_columns: string[];
}

export type ProcessingStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "computing"
  | "complete"
  | "error";
