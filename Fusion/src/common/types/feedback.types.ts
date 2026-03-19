export enum FeedbackStatus {
  RECEIVED = "RECEIVED",
  ANALYZING = "ANALYZING",
  DONE = "DONE",
  FAILED = "FAILED",
}

export interface Feedback {
  id: string;
  content: string;
  status: FeedbackStatus;
  contentHash: string;
  rawAiResponse: string | null;
  structuredResult: string | null;
  analysisError: string | null;
  createdAt: Date;
  updatedAt: Date;
}
