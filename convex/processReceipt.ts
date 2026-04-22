import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

// Updates receipt method
export const updateReceiptData = mutation({
    args: {
        id: v.id("receipts"),
        status: v.union(
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed")
        ),
        // RAW OCR output - stores what Claude actually sees
        rawText: v.optional(v.string()),


        // Data extracted by Claude
        vendor: v.optional(v.string()),
        date: v.optional(v.string()),
        totalAmount: v.optional(v.number()),

        // Items on the receipt
        items: v.optional(
            v.array(
                v.object({
                    name: v.string(),
                    type: v.optional(v.string()),
                    category: v.optional(
                        v.union(
                            v.literal("Materials"),
                            v.literal("Tools & Equipment"),
                            v.literal("Supplies"),
                            v.literal("Fuel & Transportation"),
                            v.literal("Misc")
                        )
                    ),
                    quantity: v.optional(v.number()),
                    price: v.optional(v.number())
                })
            )
        ),
        extractionNotes: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
        // const updatedReceipt = await ctx.db.get(id);
        // console.log(updatedReceipt);
    }
});

// Main OCR action - retrieves file and sends to Claude
export const processReceipt = action({
    args: {
        receiptId: v.id("receipts"),
        storageId: v.id("_storage")
    },
    handler: async (ctx, args) => {
        // get URL from storage using storageId 
        const fileUrl = await ctx.storage.getUrl(args.storageId);
        if (!fileUrl) {
            await ctx.runMutation(api.processReceipt.updateReceiptData, {
                id: args.receiptId,
                status: "failed",
                extractionNotes: "File not found in storage"
            });
            return;
        }

        // Fetch the file as binary data, Claude's api only accepts base64 encoded files
        const fileResponse = await fetch(fileUrl);
        const fileBlob = await fileResponse.blob();
        const arrayBuffer = await fileBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        uint8Array.forEach(byte => binary += String.fromCharCode(byte));
        const base64Data = btoa(binary);
        const mimeType = (fileBlob.type === "image/jpg" ? "image/jpeg" : fileBlob.type) as "image/jpeg" | "image/png" | "application/pdf";

        // Send to Claude for extraction
        try {
            const response = await client.messages.create({
                // Claude model
                model: "claude-opus-4-5",
                // tokens allowed
                max_tokens: 1024,
                // prompt 
                messages: [
                    {
                        role: "user", // user = me, assistant = Claude
                        content: [
                            // first part of prompt is the file upload (PDF or image)
                            ...(mimeType === "application/pdf"
                                ? [{
                                    type: "document" as const,
                                    source: {
                                        type: "base64" as const,
                                        media_type: "application/pdf" as const,
                                        data: base64Data,
                                    },
                                }]
                                : [{
                                    type: "image" as const,
                                    source: {
                                        type: "base64" as const,
                                        media_type: mimeType as "image/jpeg" | "image/png",
                                        data: base64Data,
                                    },
                                }]),
                            { // text prompt to tell AI to return ONYL JSON and NOTHING ELSE
                                type: "text",
                                text: `You are a receipt data extraction assistant for a contractor expense tracking app.

Analyze this receipt image and extract the following data. If this is not a receipt, respond with ONLY this JSON:
{"notAReceipt": true}

If it is a receipt, respond with ONLY valid JSON in this exact format, no other text:
{
  "vendor": "store name",
  "date": "YYYY-MM-DD",
  "totalAmount": 0.00,
  "rawText": "full text you can read from the receipt",
  "extractionNotes": "any ambiguities or issues you noticed",
  "items": [
    {
      "name": "exact item name from receipt",
      "type": "general item type e.g. Lumber, Concrete, Fasteners, Drywall, Hand Tools, Power Tools, Adhesive, Safety Equipment",
      "category": "one of: Materials, Tools & Equipment, Supplies, Fuel & Transportation, Misc",
      "quantity": 1,
      "price": 0.00
    }
  ]
}

Category guidelines:
- Materials: raw building materials (lumber, concrete, drywall, pipes)
- Tools & Equipment: hammers, drills, saw blades, measuring tools
- Supplies: tape, screws, adhesives, safety equipment, consumables
- Fuel & Transportation: gas, oil, vehicle parts
- Misc: anything that doesn't fit above, note it in extractionNotes`
                            }
                        ],

                    }
                ]
            });

            // Prase Claude's response into JS object
            const content = response.content[0];
            if (content.type !== "text") {
                throw new Error("Unexpected response type from Claude");
            }
            // console.log("Claude raw response: ", content.text);

            // gets rid of  ```json ```
            const cleanedText = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            const extracted = JSON.parse(cleanedText);

            // Check if it's actually a receipt
            if (extracted.notAReceipt) {
                await ctx.runMutation(api.processReceipt.updateReceiptData, {
                    id: args.receiptId,
                    status: "failed",
                    extractionNotes: "Uploaded file does not appear to be a receipt",
                });
                return;
            }

            // Save extracted data to database
            await ctx.runMutation(api.processReceipt.updateReceiptData, {
                id: args.receiptId,
                status: "completed",
                vendor: extracted.vendor,
                date: extracted.date,
                totalAmount: extracted.totalAmount,
                rawText: extracted.rawText,
                extractionNotes: extracted.extractionNotes,
                items: extracted.items

            });
            
        } catch (error) {
            await ctx.runMutation(api.processReceipt.updateReceiptData, {
                id: args.receiptId,
                status: "failed",
                extractionNotes: `Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
        }
    }
})