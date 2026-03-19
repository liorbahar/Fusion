import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { env } from "../../config/env";
import type { Logger } from "../../common/utils/logger";
import { analysisResultSchema, type AnalysisResult } from "./analysis.schema";
import { SYSTEM_PROMPT } from "./analysis.constants";

export class AnalysisService {
  private readonly openai: OpenAI;
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.openai = new OpenAI({ apiKey: env.openaiApiKey });
    this.logger = logger;
  }

  async analyze(content: string): Promise<{ raw: string; parsed: AnalysisResult }> {
    const completion: ChatCompletion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    });

    const raw: string = completion.choices[0]?.message?.content ?? "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.error("AI response is not valid JSON", { raw });
      throw new Error(`AI response is not valid JSON: ${raw}...`);
    }

    const validated: AnalysisResult = analysisResultSchema.parse(parsed);

    return { raw, parsed: validated };
  }
}
