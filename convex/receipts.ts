import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generates upload URL for the frontend to upload a file directly to Convex storage
export const generatedUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    }
});

// Creates a new receipt record in the database after a file has been uploaded
export const createReceipt = mutation({
    args: {
        fileUrl: v.string(),
        fileName: v.string(),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const receiptId = await ctx.db.insert("receipts", {
            status: "processing",
            fileUrl: args.fileUrl,
            fileName: args.fileName,
            storageId: args.storageId,
            uploadedAt: Date.now()
        });
        return receiptId
    }
});

// fetches all receipts
export const getAllReceipts = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("receipts").order("desc").collect();
    }
});


