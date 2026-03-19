import { createApp } from "./app";
import { env } from "./config/env";

const { app, logger } = createApp();

app.listen(env.port, () => {
  logger.info(`Server running on http://localhost:${env.port}`);
});
