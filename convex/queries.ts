import { query } from "./_generated/server";
import { v } from "convex/values";

// get all receipts
export const getAllReceipts = query({
    handler: async (ctx, args: {}) => {
        return await ctx.db.query("receipts").order("desc").collect();
    }
});

// get all completed receipts
export const getAllCompletedReceipts = query({
    handler: async (ctx, args: {}) => {
        return await ctx.db
            .query("receipts")
            .filter(query => query.eq(query.field("status"), "completed"))
            .order("desc")
            .collect();
    },
})

// Flattens receipt items
export const getReceiptItems = query({
    handler: async (ctx, args: {}) => {
        // get all receipts
        const receipts = await ctx.db
            .query("receipts")
            .filter(query => query.eq(query.field("status"), "completed"))
            .order("desc")
            .collect();

        // get all items of receipt and transform into strucutre AI can use.
        return receipts.map(receipt => (receipt.items ?? []).map(item => ({
            ...item,
            vendor: receipt.vendor,
            receiptDate: receipt.date,
            receiptId: receipt._id
        }))).flat()
    }
})

export const getReceiptById = query({
    args: { receiptId: v.id("receipts") },
    handler: async (ctx, {receiptId} ) =>  {
        return await ctx.db.get(receiptId);
    }
})