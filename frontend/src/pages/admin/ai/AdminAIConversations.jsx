import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  MessageSquare,
  User,
  Bot,
  Clock,
  Search,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const AdminAIConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConvo, setSelectedConvo] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(
          "/api/chatbot/admin/conversations?limit=100",
        );
        setConversations(response.data);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Failed to fetch conversations:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(
    (c) =>
      c.question?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-[calc(100vh-16rem)] gap-6">
      {/* List Sidebar */}
      <div className="w-1/3 bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Logs</h3>
          <span className="bg-brand-100 text-brand-700 text-xs px-2 py-1 rounded font-bold">
            {conversations.length}
          </span>
        </div>

        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Loading logs...
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((convo, idx) => (
              <div
                key={convo.id}
                onClick={() => setSelectedConvo(convo)}
                className={`
                  p-4 border-b border-gray-50 cursor-pointer transition-colors
                  ${selectedConvo?.id === convo.id ? "bg-brand-50 border-l-4 border-l-brand-500" : "hover:bg-gray-50 border-l-4 border-l-transparent"}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-gray-900 truncate pr-2">
                    {convo.user_name}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(convo.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {convo.question}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                    {convo.intent}
                  </span>
                  {convo.gemini_used && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      Gemini
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              No logs found.
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden flex flex-col">
        {selectedConvo ? (
          <>
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Log Details</h3>
                <p className="text-xs text-gray-500">
                  Session ID: {selectedConvo.conversation_id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedConvo.timestamp).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedConvo.response_time_ms} ms
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {/* User Message */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                  <p className="text-sm text-gray-800">
                    {selectedConvo.question}
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-brand-600" />
                </div>
                <div className="bg-gray-900 text-white rounded-2xl rounded-tr-sm p-4 shadow-sm w-3/4">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{selectedConvo.response}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Diagnostic Data
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block text-xs">Intent</span>
                    <span className="font-bold text-gray-900">
                      {selectedConvo.intent}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block text-xs">
                      LLM Used
                    </span>
                    <span
                      className={`font-bold ${selectedConvo.gemini_used ? "text-amber-600" : "text-green-600"}`}
                    >
                      {selectedConvo.gemini_used
                        ? "Yes (Gemini)"
                        : "No (Rule-based / Qdrant)"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100 col-span-2">
                    <span className="text-gray-500 block text-xs mb-2">
                      Sources Retrieved
                    </span>
                    {selectedConvo.sources &&
                    selectedConvo.sources.length > 0 ? (
                      <ul className="list-disc pl-4 text-gray-700">
                        {selectedConvo.sources.map((src, i) => (
                          <li key={i}>{src}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <MessageSquare className="w-12 h-12 mb-4 text-gray-200" />
            <p>Select a conversation from the sidebar to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAIConversations;
