import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

// deletes a receipt
export const deleteReceipt = mutation({
    args: {
        id: v.id("receipts"),
    },
    handler: async (ctx, args) => {
        const receipt = await ctx.db.get(args.id)
        if (!receipt) throw new Error("Receipt not found");

        await ctx.storage.delete(receipt.storageId);
        await ctx.db.delete(args.id as Id<"receipts">);
    }
})

// export const viewReceiptItems = query({
//     args: { receiptId: v.id("receipts") },
//     handler: async (ctx, args) => {
//         const receiptId = await.db.query("")
//     }
// })