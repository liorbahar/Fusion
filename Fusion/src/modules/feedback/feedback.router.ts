import { Request, Response, Router } from "express";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";

export function createFeedbackRouter(service: FeedbackService): Router {
  const router: Router = Router();
  const controller: FeedbackController = new FeedbackController(service);

  router.post("/feedback", (req: Request, res: Response, next) => {
    controller.postFeedback(req, res).catch(next);
  });
  router.get("/feedback", (req: Request, res: Response, next) => {
    controller.getFeedback(req, res).catch(next);
  });

  return router;
}
