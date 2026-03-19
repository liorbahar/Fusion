import { PrismaClient } from "@prisma/client";
import { Feedback, FeedbackStatus } from "../../common/types";

export class FeedbackRepository {
  constructor(private prisma: PrismaClient) {}

  async findByContentHash(contentHash: string): Promise<Feedback | null> {
    const row = await this.prisma.feedback.findUnique({
      where: { contentHash },
    });
    return row as Feedback | null;
  }

  async findById(id: string): Promise<Feedback | null> {
    const row = await this.prisma.feedback.findUnique({
      where: { id },
    });
    return row as Feedback | null;
  }

  async create(data: {
    content: string;
    contentHash: string;
    status: FeedbackStatus;
  }): Promise<Feedback> {
    const row = await this.prisma.feedback.create({
      data: {
        content: data.content,
        contentHash: data.contentHash,
        status: data.status,
      },
    });
    return row as Feedback;
  }

  async update(id: string, data: Partial<Omit<Feedback, "id">>): Promise<void> {
    await this.prisma.feedback.update({
      where: { id },
      data: data as Record<string, unknown>,
    });
  }

  async findAll(): Promise<Feedback[]> {
    const rows = await this.prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows as Feedback[];
  }
}
