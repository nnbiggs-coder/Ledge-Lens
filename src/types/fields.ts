export type FieldDataType =
  | "string"
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "boolean";

export type VerificationStatus =
  | "unreviewed"
  | "confirmed"
  | "corrected"
  | "rejected";

export type ExtractionMethod = "ai" | "rule" | "manual" | "seeded";

export interface ExtractedField {
  id: string;
  fieldName: string;
  category: string;
  normalizedValue: string | number | boolean | null;
  originalValue: string | null;
  dataType: FieldDataType;
  confidence: number;
  sourceDocumentId: string;
  sourceDocumentName: string;
  pageNumber?: number;
  section?: string;
  evidenceText: string;
  extractionMethod: ExtractionMethod;
  verificationStatus: VerificationStatus;
}
