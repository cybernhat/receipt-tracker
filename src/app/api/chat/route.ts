import { stepCountIs, streamText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { z } from "zod";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const formattedMessages = messages.map((m: any) => ({
    role: m.role,
    content: m.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("") ?? m.content ?? ""
  }));

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: `You are an expense assistant for contractors.
    You have access to their uploaded receipt data.
    Answer questions about spending clearly and consisely.
    When you have price amounts, format dollar amounts like $123.45.
    If you're unsure, say so - DO NOT make up figures.`,
    messages: formattedMessages,
    stopWhen: stepCountIs(5),
    tools: {
      getReceipts: tool({
        description:
          "Fetch all processed receipts. Use this for questions about vendors, dates, totals, or overall spending.",
        inputSchema: z.object({}), // no filters — agent reasons over the full set
        execute: async () => {
          const receipts = await convex.query(api.queries.getAllCompletedReceipts);
          return receipts.map((r) => ({
            id: r._id,
            vendor: r.vendor,
            date: r.date,
            totalAmount: r.totalAmount,
            fileName: r.fileName,
          }));
        },
      }),
      getLineItems: tool({
        description:
          "Fetch all individual line items across all receipts, each tagged with vendor and date. Use this for questions about specific products, categories (Materials, Tools & Equipment, Supplies, Fuel & Transportation, Misc), or item-level spending.",
        inputSchema: z.object({}),
        execute: async () => {
          return await convex.query(api.queries.getReceiptItems);
        },
      }),
    },
  })
  return result.toUIMessageStreamResponse();
}   
