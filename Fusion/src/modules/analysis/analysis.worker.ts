const Queue = require("better-queue");
import type { AnalysisResult } from "./analysis.schema";
import { Feedback, FeedbackStatus } from "../../common/types";
import type { Logger } from "../../common/utils/logger";
import { FeedbackRepository } from "../feedback/feedback.repository";
import { AnalysisService } from "./analysis.service";

export class AnalysisWorker {
  private feedbackRepository: FeedbackRepository;
  private analysisService: AnalysisService;
  private logger: Logger;
  private queue: ReturnType<typeof Queue>;

  constructor(
    feedbackRepository: FeedbackRepository,
    analysisService: AnalysisService,
    logger: Logger
  ) {
    this.feedbackRepository = feedbackRepository;
    this.analysisService = analysisService;
    this.logger = logger;
    this.queue = new Queue(
      async (job: { feedbackId: string }, cb: (err?: Error) => void) => {
        try {
          await this.processFeedbackJob(job.feedbackId);
          cb();
        } catch (err) {
          this.logger.error("Worker job failed", err);
          cb(err instanceof Error ? err : new Error(String(err)));
        }
      },
      { concurrent: 3 }
    );
  }

  enqueue(feedbackId: string): void {
    this.queue.push({ feedbackId });
  }

  private async processFeedbackJob(feedbackId: string): Promise<void> {
    const feedback: Feedback | null = await this.feedbackRepository.findById(feedbackId);

    if (!feedback || feedback.status !== FeedbackStatus.RECEIVED) {
      return;
    }

    await this.feedbackRepository.update(feedbackId, { status: FeedbackStatus.ANALYZING });
    this.logger.info("Worker starts analyzing");

    try {
      const { raw, parsed }: { raw: string; parsed: AnalysisResult } =
        await this.analysisService.analyze(feedback.content);

      await this.feedbackRepository.update(feedbackId, {
        status: FeedbackStatus.DONE,
        rawAiResponse: raw,
        structuredResult: JSON.stringify(parsed),
      });
      this.logger.info("AI finishes successfully");
    } catch (err) {
      const errorMessage: string =
        err instanceof Error ? err.message : String(err);
      this.logger.error("AI analysis failed", err);
      await this.feedbackRepository.update(feedbackId, {
        status: FeedbackStatus.FAILED,
        analysisError: errorMessage,
      });
    }
  }
}
