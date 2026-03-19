import { Feedback, FeedbackStatus } from "../../common/types";
import { hashContent } from "../../common/utils/crypto.util";
import type { Logger } from "../../common/utils/logger";
import { AnalysisWorker } from "../analysis/analysis.worker";
import { FeedbackRepository } from "./feedback.repository";

export class FeedbackService {
  constructor(
    private repository: FeedbackRepository,
    private analysisWorker: AnalysisWorker,
    private logger: Logger
  ) {}

  async submitFeedback(content: string): Promise<Feedback> {
    const trimmed: string = content.trim();
    const contentHash: string = hashContent(trimmed);

    const existing: Feedback | null = await this.repository.findByContentHash(contentHash);

    if (existing) {
      this.logger.info("Duplicate found (Hash hit)");
      return existing;
    }

    const feedback: Feedback = await this.repository.create({
      content: trimmed,
      contentHash,
      status: FeedbackStatus.RECEIVED,
    });

    this.analysisWorker.enqueue(feedback.id);

    this.logger.info("New feedback received");
    return feedback;
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return this.repository.findAll();
  }
}
