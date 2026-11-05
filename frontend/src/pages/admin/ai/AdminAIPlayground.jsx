import React, { useState } from "react";
import axios from "axios";
import { Play, Loader2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";

const AdminAIPlayground = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTest = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post("/api/chatbot/admin/playground", {
        message: input,
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Playground test failed. Ensure the AI service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">AI Playground</h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
          Debug Mode
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Test queries directly against the AI engine. These tests do not use
        memory and are not logged in production analytics.
      </p>

      <form onSubmit={handleTest} className="flex gap-4">
        <input
          type="text"
          className="flex-1 p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm"
          placeholder="e.g. Find me a cheap wooden chair..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          Test
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Main Response */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">
              Assistant Response
            </div>
            <div className="p-6 prose prose-sm max-w-none">
              <ReactMarkdown>{result.response}</ReactMarkdown>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-fit">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm flex items-center gap-2">
              <Info className="w-4 h-4" /> Debug Data
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">
                  Detected Intent
                </span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 font-bold">
                  {result.intent}
                </span>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Performance</span>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Response Time</span>
                    <span className="font-semibold text-gray-900">
                      {result.response_time_ms} ms
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Gemini Used</span>
                    <span
                      className={`font-semibold ${result.gemini_used ? "text-amber-600" : "text-green-600"}`}
                    >
                      {result.gemini_used ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {result.sources && result.sources.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-2">Sources Used</span>
                  <div className="space-y-2">
                    {result.sources.map((s, i) => (
                      <div
                        key={i}
                        className="flex flex-col p-2 bg-gray-50 rounded border border-gray-100"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 text-xs truncate max-w-[150px]">
                            {s.title}
                          </span>
                          {s.score && (
                            <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">
                              {(s.score * 100).toFixed(1)}% match
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
                          {s.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIPlayground;
