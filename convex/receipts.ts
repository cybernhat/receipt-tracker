import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generates upload URL for the frontend to upload a file directly to Convex storage
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    }
});

// Creates a new receipt record in the database after a file has been uploaded
export const createReceipt = mutation({
    args: {
        fileName: v.string(),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const receiptId = await ctx.db.insert("receipts", {
            status: "processing",
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

// deletes a receipt
export const deleteReceipt = mutation({
    args: {
        id: v.id("receipts"),
        storageId: v.id("_storage")
    },
    handler: async (ctx, args) => {
        await ctx.storage.delete(args.storageId);
        await ctx.db.delete(args.id);
    }
})