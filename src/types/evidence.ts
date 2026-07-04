export interface EvidenceReference {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  section?: string;
  excerpt: string;
  confidence: number;
}

export interface SubmissionDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  pageCount?: number;
}
