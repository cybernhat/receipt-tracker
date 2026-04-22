# Receipt Tracker

A contractor expense tracking AI agent that ingests receipt images and PDFs, extracts structured data using AI, and allows natural language querying of expenses.

---

## Built With

- **[Next.js](https://nextjs.org/)** — React framework for the frontend
- **[Convex](https://convex.dev/)** — Backend-as-a-service: serverless functions, database, and file storage
- **[Vercel AI SDK](https://sdk.vercel.ai/)** — AI agent and streaming for natural language queries
- **[Anthropic Claude](https://anthropic.com/)** — Vision model for OCR and receipt data extraction
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling

---

## Features

- AI Agent that takes care of receipt upload, processing, and deletion.
- AI Agent allows natural language querying of expenses.
---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev/) account (free)
- An [Anthropic](https://console.anthropic.com/) API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/Cybernhat/receipt-tracker.git
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables — create a `.env.local` file in the project root:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. Initialize Convex

```bash
npx convex dev
```

This will prompt you to log in and create a project. Once connected, it will automatically add `NEXT_PUBLIC_CONVEX_URL` to your `.env.local`.

5. Add your Anthropic API key to Convex's environment

```bash
npx convex env set ANTHROPIC_API_KEY your_anthropic_api_key_here
```

6. Start the development server in a separate terminal

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

> Note: Keep `npx convex dev` running in a separate terminal while developing. It syncs your backend functions to the cloud in real time.

---

## How It Works

### Ingestion Pipeline

```
User uploads receipt (image/PDF)
        ↓
File stored in Convex Storage → storageId saved to DB (status: "processing")
        ↓
Convex action retrieves file, converts to base64
        ↓
Claude Vision analyzes the receipt image
        ↓
Structured JSON extracted 
        ↓
DB record updated (status: "completed")
```

### Query Agent

The AI agent receives the user's natural language question, queries the Convex database for relevant receipt and item data, and returns a conversational answer with specific figures.

---

## Key Design Decisions & Assumptions

**Category per item, not per receipt** - 
A single receipt from Home Depot might contain lumber (Materials), a hammer (Tools & Equipment), and tape (Supplies). Assigning one category to the whole receipt would lose that granularity. Instead, each line item is individually categorized by Claude during extraction.

**Raw text stored alongside structured data** - 
The full OCR text Claude reads from the receipt is stored in `rawText`. This provides a fallback for debugging misparses and makes the data more auditable.

**
**Failed uploads are surfaced, not silently deleted** -
If uploaded file fails to extract data from file (not a receipt, blurry, etc..), it will be marked as `failed` instead of automatically deleted and generate an `extractionNotes`. This allows context to aid in debugging in the future.

**extractionNotes takes care of ambiguity and aids in debugging** -
Any problems with receipt processing will be logged as extractionNotes. This can be anything from failure to extract data (not a receipt, blurry, etc.) to ambiguous equipment categorization. This helps with debugging or viewing AI's logic.

---

## Areas for Improvement
 - **Specific Query for AI Agent** - Current approach is to get all receipts/items for agent, which costs a lot of token. I'd reduce token use by adding specific queries instead.
 - **Use Redis for Cashing** - Similarly to the first point, the agent queries for every single prompt request, and JSON itself costs a lot of token. I'd implement caching through Redis to fix this issue.
 - **Optimizing AI tooling resource usage** - Currently, every tool call sends Claude the entire conversation, which is extremely costly. I'd add some sort of summarization or message windowing to minimize token use even more.

## What I'd Add With More Time
- **PDF receipt summary export** — generate a formatted PDF summary for any stored receipt using `react-pdf`, with a breakdown by category and line item table
- **Project tagging** — associate receipts with specific job sites or projects (e.g. "Kitchen Renovation") for per-project expense tracking. This would require a separate `projects` table and a relationship between receipts and projects
- **Authentication** — add user accounts so multiple contractors can use the same instance with isolated data
- **Duplicate detection** — flag receipts that appear to be duplicates based on vendor, date, and total amount
- **Multiple processes** — allow multiple receipts to be uploaded and processed
- **Retry mechanism** — automatically retry failed extractions instead of requiring manual deletion and re-upload
- **Pagination** — the receipt list currently loads all records at once; pagination or infinite scroll would be needed at scale

---
