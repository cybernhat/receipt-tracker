"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const [dragOver, setDragOver] = useState(false);
  
  const receipts = useQuery(api.queries.getAllReceipts);
  const deleteReceipt = useMutation(api.receipts.deleteReceipt);
  
  // File handling function in order to store uploaded file to db
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const createReceipt = useMutation(api.receipts.createReceipt);
  const processReceipt = useAction(api.processReceipt.processReceipt);


  async function handleFileUpload(file: File) {
    if (!file) return;

    // Allows specific file type (images and PDFs)
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("File type not valid. Please upload an image or PDF file.");
      return;
    }

    try {
      setUploading(true);

      // Call temporary upload URL method from convex/receipt
      const uploadUrl = await generateUploadUrl();

      // Upload the file directly to storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file
      });

      const { storageId } = await response.json();

      // Create receipt in the database
      const receiptId = await createReceipt({
        storageId,
        fileName: file.name
      })

      await processReceipt({
        receiptId,
        storageId
      })

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again");
    } finally {
      setUploading(false);

      //resets upload 
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };


  }

  // Drag/drop feature
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Receipt Tracker</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Upload receipts and query your expenses with AI
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center mb-8 transition-colors ${dragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-700 hover:border-gray-500"
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <p className="text-gray-300 mb-1">
            {uploading ? "Uploading..." : "Drop your receipt here"}
          </p>
          <p className="text-gray-500 text-sm mb-4">Supports JPG, PNG, PDF</p>
          <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploading
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-900 hover:bg-gray-200"
            }`}>
            {uploading ? "Uploading..." : "Choose File"}
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,application/pdf"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
        </div>

        {/* Receipt List */}
        <div>
          <h2 className="text-lg font-medium mb-4">Receipts</h2>
          {receipts === undefined ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : receipts.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No receipts yet. Upload one above.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt._id}
                  className="bg-gray-900 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {receipt.vendor ?? receipt.fileName}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {receipt.date ?? new Date(receipt.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {receipt.totalAmount
                        ? `$${receipt.totalAmount.toFixed(2)}`
                        : "—"}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${receipt.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : receipt.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                      {receipt.status}
                    </span>
                    <button
                      onClick={() => deleteReceipt({
                        id: receipt._id,
                        storageId: receipt.storageId
                      })}
                      className="ml-2 text-xs text-red-400 hover:text-red-300 mt-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
