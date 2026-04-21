"use client";

import { useChat } from "@ai-sdk/react";
import React, { useRef, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { generateUploadUrl } from "../../../convex/receipts";
import { api } from "../../../convex/_generated/api";

export default function ChatPage() {
    const { messages, sendMessage, status } = useChat();
    const [input, setInput] = useState("");
    const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);

    // Auto scroll when new messages are generated in chat
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;
        setInput("");
        await sendMessage({ text: input });
    }

    // image upload
    async function handleFileUpload(file: File) {
        if (!file) return;

        // checks file type
        const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            alert("File type not valid. Please upload an image or PDF file.");
            return;
        }

        // file process logic
        try {
            // get url
            const uploadUrl = await generateUploadUrl();

            // post to storage
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file
            });

            const { storageId } = await response.json();

            // tells Claude to call the process receipt tool.
            await sendMessage(
                {
                    text: `Process this receipt. storageId: ${storageId} fileName: ${file.name}`
                })
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again");
        } finally {
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    }

    return (
        <main className="min-h-screen bg-gray-950 text-white flex flex-col">

            <div className="border-b border-gray-800 p-4">
                <h1 className="text-lg font-semibold">Expense Assistant</h1>
                <p className="text-gray-400 text-sm">Ask anything about your receipts</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
                {messages.length === 0 && (
                    <div className="text-gray-500 text-sm space-y-1 pt-8">
                        <p>Try asking:</p>
                        <p className="text-gray-400">"How much did I spend at Home Depot?"</p>
                        <p className="text-gray-400">"Show me all Materials purchases"</p>
                        <p className="text-gray-400">"What's my total spending this month?"</p>
                    </div>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"
                            }`}>
                            {m.parts
                                .filter((p) => p.type === "text")
                                .map((p, i) => (
                                    <span key={i}>{p.type === "text" ? p.text : ""}</span>
                                ))}
                        </div>
                    </div>
                ))}

                {status === "streaming" && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-xl px-4 py-2 text-sm text-gray-400">
                            Thinking...
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-800 p-4">
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
                    <label className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        +
                        <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                                e.target.value = ''; // reset so same file can be uploaded again
                            }}
                        />
                    </label>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your expenses..."
                        disabled={status === "streaming"}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={status === "streaming" || !input.trim()}
                        className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </main>
    );
}