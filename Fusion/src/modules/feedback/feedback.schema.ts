import { z } from "zod";

export const postFeedbackSchema = z.object({
  content: z.string().min(1, "content is required and must be a non-empty string").trim(),
});

export type PostFeedbackBody = z.infer<typeof postFeedbackSchema>;
