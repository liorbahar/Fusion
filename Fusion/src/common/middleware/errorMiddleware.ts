import type { Request, Response, NextFunction } from "express";
import type { Logger } from "../utils/logger";

export function createErrorMiddleware(logger: Logger) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    logger.error("Request error", err);

    res.status(500).json({ error: "Internal server error" });
  };
}
