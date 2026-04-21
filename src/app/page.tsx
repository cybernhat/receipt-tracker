import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-8 text-2xl">
          🧾
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-semibold mb-4">Receipt Tracker</h1>
        <p className="text-gray-400 text-lg mb-12 leading-relaxed">
          Upload your receipts and ask questions about your expenses — powered by AI.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-sm font-medium mb-1">Upload</p>
            <p className="text-gray-500 text-xs">Images and PDFs</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-sm font-medium mb-1">Extract</p>
            <p className="text-gray-500 text-xs">AI-powered OCR</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-sm font-medium mb-1">Query</p>
            <p className="text-gray-500 text-xs">Natural language</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/chat"
          className="inline-block w-full py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}