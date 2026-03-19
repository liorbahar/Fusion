import "dotenv/config";

export const env: {
  port: number;
  databaseUrl: string;
  openaiApiKey: string;
} = {
  port: Number(process.env.PORT) || 3002,
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
};
