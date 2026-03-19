import "dotenv/config";
import express, { Express } from "express";
import { Router } from "express";
import { prisma } from "./config";
import { Logger } from "./common/utils/logger";
import { createErrorMiddleware } from "./common/middleware/errorMiddleware";
import { FeedbackRepository } from "./modules/feedback/feedback.repository";
import { FeedbackService } from "./modules/feedback/feedback.service";
import { createFeedbackRouter } from "./modules/feedback/feedback.router";
import { AnalysisService } from "./modules/analysis/analysis.service";
import { AnalysisWorker } from "./modules/analysis/analysis.worker";

export function createApp(): { app: Express; logger: Logger } {
  const app: Express = express();
  app.use(express.json());

  const logger: Logger = new Logger();
  const feedbackRepository: FeedbackRepository = new FeedbackRepository(prisma);
  const analysisService: AnalysisService = new AnalysisService(logger);
  const analysisWorker: AnalysisWorker = new AnalysisWorker(
    feedbackRepository,
    analysisService,
    logger
  );
  const feedbackService: FeedbackService = new FeedbackService(
    feedbackRepository,
    analysisWorker,
    logger
  );
  const router: Router = createFeedbackRouter(feedbackService);

  app.use("/", router);

  app.use(createErrorMiddleware(logger));

  return { app, logger };
}
