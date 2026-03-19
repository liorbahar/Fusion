import { Request, Response } from "express";
import { Feedback } from "../../common/types";
import { FeedbackService } from "./feedback.service";
import { postFeedbackSchema } from "./feedback.schema";

export class FeedbackController {
  constructor(private service: FeedbackService) {}

  async postFeedback(req: Request, res: Response): Promise<void> {
    const parsed: ReturnType<typeof postFeedbackSchema.safeParse> =
      postFeedbackSchema.safeParse(req.body);

    if (!parsed.success) {
      const message: string = parsed.error.errors[0]?.message ?? "Invalid request";
      res.status(400).json({ error: message });
      return;
    }

    const { content }: { content: string } = parsed.data;

    const result: Feedback = await this.service.submitFeedback(content);

    res.status(202).json(result);
  }

  async getFeedback(req: Request, res: Response): Promise<void> {
    const items: Feedback[] = await this.service.getAllFeedback();
    res.json(items);
  }
}
