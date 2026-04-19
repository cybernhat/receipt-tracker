import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


// Defines data structure for Convex
export default defineSchema({

    // Creates a table
    receipts: defineTable({
        status: v.union(
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed")
        ),
        fileUrl: v.string(),
        fileName: v.string(),
        uploadedAt: v.number(),
        storageId: v.string(),

        // RAW OCR output - stores what Claude actually sees
        rawText: v.optional(v.string()),
        

        // Data extracted by Claude
        vendor: v.optional(v.string()),
        date: v.optional(v.string()),
        totalAmount: v.optional(v.number()),
        category: v.optional(
            v.union(
                v.literal("Materials"),
                v.literal("Tools & Equipment"),
                v.literal("Supplies"),
                v.literal("Fuel & Transportation"),
                v.literal("Misc")
            )
        ),

        // Items on the receipt
        items: v.optional(
            v.array(
                v.object({
                    name: v.string(),
                    quantity: v.optional(v.number()),
                    price: v.optional(v.number())
                })
            )
        ),

        // Claude's notes on data extraction
        extractionNotes: v.optional(v.string()),
    })
})